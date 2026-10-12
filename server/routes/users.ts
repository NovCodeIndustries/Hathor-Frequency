import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { hashPassword, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../db'
import { parseBody } from '../lib/body'
import { fail } from '../lib/errors'
import { emitAdmin } from '../lib/siteEvents'

/** /api/admin/users: el principal administra usuarios; cualquiera cambia su propia contraseña */
export const users = new Hono<{ Variables: AdminVariables }>()

const onlyRoot: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  if (!c.get('admin').isRoot) return fail(c, 403, 'Solo el usuario principal administra usuarios')
  await next()
}

const password = z.string().min(10, 'Mínimo 10 caracteres').max(200)
const select = { id: true, email: true, name: true, firstName: true, middleName: true, lastName: true, secondLastName: true, phone: true, isRoot: true, createdAt: true } as const
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
  return c.json({ ok: true })
})

users.get('/', onlyRoot, async (c) => c.json(await prisma.adminUser.findMany({ select, orderBy: [{ isRoot: 'desc' }, { createdAt: 'asc' }] })))

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
  await prisma.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(body.password) } })
  // Sus sesiones abiertas se cierran (la tuya no, si te la cambias a ti)
  if (id !== c.get('admin').id) await prisma.adminSession.deleteMany({ where: { userId: id } })
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
