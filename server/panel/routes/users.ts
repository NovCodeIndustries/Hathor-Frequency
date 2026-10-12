import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { hashPassword, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { emitAdmin } from '../../shared/lib/siteEvents'
import { staffDomain, staffEmailLocal } from '../../../src/data/staff'
import { AdminRole } from '../../generated/prisma/enums'
import { dateFromISO, isoFromDate, todayISO } from '../../shared/lib/dates'

/** /api/admin/users: el principal administra usuarios; cualquiera cambia su propia contraseña */
export const users = new Hono<{ Variables: AdminVariables }>()

const onlyRoot: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  if (!c.get('admin').isRoot) return fail(c, 403, 'Solo el usuario principal administra usuarios')
  await next()
}

const password = z.string().min(10, 'Mínimo 10 caracteres').max(200)
const select = { id: true, email: true, name: true, firstName: true, middleName: true, lastName: true, secondLastName: true, phone: true, isRoot: true, role: true, birthDate: true, lockedUntil: true, createdAt: true } as const
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

/** Nombre y teléfono de un usuario (los mismos campos que al darlo de alta) */
const profileSchema = z.object({
  firstName: part(60).min(1, 'Escribe el primer nombre'),
  middleName: part(60).optional(),
  lastName: part(60).min(1, 'Escribe el primer apellido'),
  secondLastName: part(60).optional(),
  phone: z.string().trim().regex(/^[\d+()\s-]{8,20}$/, 'Teléfono inválido'),
  /** ADMIN: todo el panel · STAFF: solo Agenda, Contactos y Mi cuenta */
  role: z.enum(AdminRole).optional(),
  /** "YYYY-MM-DD": ese día la web festeja su cumpleaños; null = sin fecha */
  birthDate: z.iso
    .date('Fecha inválida')
    .refine((d) => d >= '1900-01-01' && d <= todayISO(), 'Fecha fuera de rango')
    .nullable()
    .optional(),
})

/** Fila de un usuario para el panel: la fecha de nacimiento como "YYYY-MM-DD" */
const toRow = <T extends { birthDate: Date | null }>(u: T) => ({ ...u, birthDate: u.birthDate ? isoFromDate(u.birthDate) : null })

/** Correo libre para "jnunez": jnunez@…, o jnunez2@…, jnunez3@… (sin contar el del propio usuario) */
async function freeStaffEmail(local: string, exceptId?: string): Promise<string> {
  const taken = new Set(
    (await prisma.adminUser.findMany({ where: { email: { startsWith: local }, id: exceptId ? { not: exceptId } : undefined }, select: { email: true } })).map(
      (u) => u.email,
    ),
  )
  let email = `${local}@${staffDomain}`
  for (let n = 2; taken.has(email); n++) email = `${local}${n}@${staffDomain}`
  return email
}

users.get('/', onlyRoot, async (c) => {
  const rows = await prisma.adminUser.findMany({ select, orderBy: [{ isRoot: 'desc' }, { createdAt: 'asc' }] })
  // Solo se manda el bloqueo si sigue vigente
  const now = new Date()
  return c.json(rows.map((u) => toRow({ ...u, lockedUntil: u.lockedUntil && u.lockedUntil > now ? u.lockedUntil : null })))
})

users.post('/', onlyRoot, async (c) => {
  const body = await parseBody(c, profileSchema.extend({ password }))
  if (body instanceof Response) return body
  // El correo se genera: primera letra del primer nombre + primer apellido; si ya existe, jnunez2, jnunez3…
  const local = staffEmailLocal(body.firstName, body.lastName)
  if (!local) return fail(c, 400, 'Datos inválidos', { firstName: 'Usa letras en el nombre y el apellido' })
  const email = await freeStaffEmail(local)
  const user = await prisma.adminUser.create({
    data: {
      firstName: body.firstName,
      middleName: body.middleName || null,
      lastName: body.lastName,
      secondLastName: body.secondLastName || null,
      phone: body.phone,
      name: fullName({ ...body, middleName: body.middleName || undefined, secondLastName: body.secondLastName || undefined }),
      email,
      role: body.role ?? AdminRole.ADMIN,
      birthDate: body.birthDate ? dateFromISO(body.birthDate) : null,
      passwordHash: await hashPassword(body.password),
    },
    select,
  })
  emitAdmin('users')
  return c.json(toRow(user), 201)
})

/**
 * El principal edita el nombre y el teléfono de un usuario. Con `regenerateEmail`, el correo se vuelve a armar
 * con el nombre nuevo (el del principal no cambia: es ROOT_ADMIN_EMAIL). Cambiar el correo cierra sus sesiones.
 */
users.patch('/:id', onlyRoot, async (c) => {
  const body = await parseBody(c, profileSchema.extend({ regenerateEmail: z.boolean().optional() }))
  if (body instanceof Response) return body
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Usuario no encontrado')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  let email = user.email
  if (body.regenerateEmail && !user.isRoot) {
    const local = staffEmailLocal(body.firstName, body.lastName)
    if (!local) return fail(c, 400, 'Datos inválidos', { firstName: 'Usa letras en el nombre y el apellido' })
    email = await freeStaffEmail(local, id)
  }
  const middleName = body.middleName || null
  const secondLastName = body.secondLastName || null
  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      firstName: body.firstName,
      middleName,
      lastName: body.lastName,
      secondLastName,
      phone: body.phone,
      name: fullName({ ...body, middleName: middleName ?? undefined, secondLastName: secondLastName ?? undefined }),
      email,
      // El principal siempre es ADMIN; el rol nuevo vale desde su siguiente petición
      role: user.isRoot ? AdminRole.ADMIN : (body.role ?? user.role),
      // Sin el campo, se queda la que tenía; null la borra
      birthDate: body.birthDate === undefined ? user.birthDate : body.birthDate ? dateFromISO(body.birthDate) : null,
    },
    select,
  })
  // Con otro correo entra con el nuevo: sus sesiones se cierran (de la tuya, todas menos esta)
  if (email !== user.email) await prisma.adminSession.deleteMany({ where: { userId: id, id: { not: c.get('sessionId') } } })
  emitAdmin('users')
  return c.json(toRow(updated))
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
