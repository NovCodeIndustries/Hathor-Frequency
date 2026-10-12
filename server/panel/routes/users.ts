import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { hashPassword, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { emitAdmin } from '../../shared/lib/siteEvents'

/** /api/admin/users: el principal administra usuarios; cualquiera cambia su propia contraseña */
export const users = new Hono<{ Variables: AdminVariables }>()

const onlyRoot: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  if (!c.get('admin').isRoot) return fail(c, 403, 'Solo el usuario principal administra usuarios')
  await next()
}

const password = z.string().min(10, 'Mínimo 10 caracteres').max(200)
const select = { id: true, email: true, name: true, firstName: true, middleName: true, lastName: true, secondLastName: true, phone: true, isRoot: true, lockedUntil: true, createdAt: true } as const
const part = (max: number) => z.string().trim().max(max)
/** Nombre completo: primer nombre, segundo nombre, primer apellido, segundo apellido */
const fullName = (u: { firstName: string; middleName?: string; lastName: string; secondLastName?: string }) =>
  [u.firstName, u.middleName, u.lastName, u.secondLastName].filter(Boolean).join(' ').slice(0, 120)

/** Cambiar la propia contraseña (pide la actual); cierra las demás sesiones */
users.patch('/me/password', async (c) => {
  const body = await parseBody(c, z.object({ current: z.string().min(1, 'Escribe tu contraseña actual'), next: password }))
  if (body instanceof Response) return body
  const me = await prisma.adminUser.findUnique({ where: { id: c.get('admin').id } })
  if (!me || !(await verifyPassword(body.current, me.passwordHash))) return fail(c, 400, 'La contraseña actual no es correcta', { current: 'No coincide' })
  await prisma.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(body.next) } })
  await prisma.adminSession.deleteMany({ where: { userId: me.id, id: { not: c.get('sessionId') } } })
  return c.json({ ok: true })
})

/** Mis sesiones abiertas (esta primero) */
users.get('/me/sessions', async (c) => {
  const rows = await prisma.adminSession.findMany({
    where: { userId: c.get('admin').id, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, createdAt: true, lastSeenAt: true, ip: true, userAgent: true },
  })
  const current = c.get('sessionId')
  return c.json(rows.map((r) => ({ ...r, current: r.id === current })).sort((a, b) => Number(b.current) - Number(a.current)))
})

/** Cierra una de mis sesiones (no la actual: para esa está "Cerrar sesión") */
users.delete('/me/sessions/:id', async (c) => {
  const id = c.req.param('id')
  if (id === c.get('sessionId')) return fail(c, 400, 'Para cerrar esta sesión usa "Cerrar sesión"')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Sesión no encontrada')
  const { count } = await prisma.adminSession.deleteMany({ where: { id, userId: c.get('admin').id } })
  if (!count) return fail(c, 404, 'Sesión no encontrada')
  return c.json({ ok: true })
})

/** Cierra todas mis sesiones menos esta */
users.delete('/me/sessions', async (c) => {
  const { count } = await prisma.adminSession.deleteMany({ where: { userId: c.get('admin').id, id: { not: c.get('sessionId') } } })
  return c.json({ ok: true, closed: count })
})

/** Registro de accesos: los últimos 100 intentos de login (solo el principal) */
users.get('/access-log', onlyRoot, async (c) =>
  c.json(
    await prisma.adminLoginEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, email: true, success: true, reason: true, ip: true, userAgent: true, createdAt: true, user: { select: { name: true } } },
    }),
  ),
)

users.get('/', onlyRoot, async (c) => {
  const rows = await prisma.adminUser.findMany({ select, orderBy: [{ isRoot: 'desc' }, { createdAt: 'asc' }] })
  // Solo se manda el bloqueo si sigue vigente
  const now = new Date()
  return c.json(rows.map((u) => ({ ...u, lockedUntil: u.lockedUntil && u.lockedUntil > now ? u.lockedUntil : null })))
})

users.post('/', onlyRoot, async (c) => {
  const body = await parseBody(
    c,
    z.object({
      firstName: part(60).min(1, 'Escribe el primer nombre'),
      middleName: part(60).optional(),
      lastName: part(60).min(1, 'Escribe el primer apellido'),
      secondLastName: part(60).optional(),
      phone: z.string().trim().regex(/^[\d+()\s-]{8,20}$/, 'Teléfono inválido'),
      email: z.string().trim().toLowerCase().max(254).pipe(z.email('Correo inválido')),
      password,
    }),
  )
  if (body instanceof Response) return body
  const taken = await prisma.adminUser.findUnique({ where: { email: body.email } })
  if (taken) return fail(c, 409, 'Ya existe un usuario con ese correo', { email: 'Ya existe' })
  const user = await prisma.adminUser.create({
    data: {
      firstName: body.firstName,
      middleName: body.middleName || null,
      lastName: body.lastName,
      secondLastName: body.secondLastName || null,
      phone: body.phone,
      name: fullName({ ...body, middleName: body.middleName || undefined, secondLastName: body.secondLastName || undefined }),
      email: body.email,
      passwordHash: await hashPassword(body.password),
    },
    select,
  })
  emitAdmin('users')
  return c.json(user, 201)
})

/** El principal pone una contraseña nueva a otro usuario (y le cierra las sesiones) */
users.patch('/:id/password', onlyRoot, async (c) => {
  const body = await parseBody(c, z.object({ password }))
  if (body instanceof Response) return body
  const id = c.req.param('id')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  // Una contraseña nueva también quita el bloqueo por intentos fallidos
  await prisma.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(body.password), failedLogins: 0, lockedUntil: null } })
  // Sus sesiones abiertas se cierran (de la tuya, todas menos esta)
  await prisma.adminSession.deleteMany({ where: { userId: id, id: { not: c.get('sessionId') } } })
  return c.json({ ok: true })
})

users.delete('/:id', onlyRoot, async (c) => {
  const id = c.req.param('id')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  if (user.isRoot) return fail(c, 400, 'El usuario principal no se puede borrar')
  await prisma.adminUser.delete({ where: { id } })
  emitAdmin('users')
  return c.json({ ok: true })
})
