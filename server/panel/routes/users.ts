import { Hono, type MiddlewareHandler } from 'hono'
import { DEFAULT_STAFF_VIEWS, panelViewIds } from '../../../src/data/panelViews'
import { z } from 'zod'
import { hashPassword, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { emitAdmin } from '../../shared/lib/siteEvents'
import { staffUsername } from '../../../src/data/staff'
import { generateTempPassword, openTempPassword, sealTempPassword } from '../lib/tempPassword'
import { hasAppSecret } from '../lib/secretBox'
import { checkPendingCode, clearTwoFactor, newRecoveryCodes, startSetup, verifySecondFactor } from '../lib/twoFactor'
import { AdminRole } from '../../generated/prisma/enums'
import { dateFromISO, isoFromDate, todayISO } from '../../shared/lib/dates'

/** /api/admin/users: el principal administra usuarios; cualquiera cambia su propia contraseña */
export const users = new Hono<{ Variables: AdminVariables }>()

const onlyRoot: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  if (!c.get('admin').isRoot) return fail(c, 403, 'Solo el usuario principal administra usuarios')
  await next()
}

const password = z.string().min(10, 'Mínimo 10 caracteres').max(200)
const select = { id: true, username: true, name: true, firstName: true, middleName: true, lastName: true, secondLastName: true, phone: true, isRoot: true, role: true, views: true, twoFactorAt: true, birthDate: true, lockedUntil: true, tempPassword: true, mustChangePassword: true, createdAt: true } as const
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
  // Ya es suya: la temporal se borra y deja de pedirle cambiarla
  await prisma.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(body.next), tempPassword: null, mustChangePassword: false } })
  await prisma.adminSession.deleteMany({ where: { userId: me.id, id: { not: c.get('sessionId') } } })
  return c.json({ ok: true })
})

/**
 * Bienvenida (W5): quien entró con su contraseña temporal pone la suya sin volver a escribir la temporal.
 * Solo mientras tenga temporal; después, en Mi cuenta pide la actual.
 */
users.patch('/me/first-password', async (c) => {
  const body = await parseBody(c, z.object({ next: password }))
  if (body instanceof Response) return body
  const me = await prisma.adminUser.findUnique({ where: { id: c.get('admin').id } })
  if (!me?.mustChangePassword) return fail(c, 400, 'Tu contraseña ya es tuya: cámbiala en Mi cuenta')
  if (openTempPassword(me.tempPassword) === body.next) return fail(c, 400, 'Elige una distinta a la temporal', { next: 'Es la temporal' })
  await prisma.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(body.next), tempPassword: null, mustChangePassword: false } })
  await prisma.adminSession.deleteMany({ where: { userId: me.id, id: { not: c.get('sessionId') } } })
  emitAdmin('users')
  return c.json({ ok: true })
})

/** Guías del panel: marca la de un módulo como vista para que no vuelva a salir sola */
users.post('/me/guides', async (c) => {
  const body = await parseBody(c, z.object({ key: z.string().regex(/^[a-z]{2,20}$/) }))
  if (body instanceof Response) return body
  const me = c.get('admin')
  if (!me.guidesSeen.includes(body.key)) {
    await prisma.adminUser.update({ where: { id: me.id }, data: { guidesSeen: { push: body.key } } })
  }
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

// ── Verificación en dos pasos (2FA): obligatoria para Admin, opcional para Staff ──

const codeSchema = z.object({ code: z.string().trim().min(6, 'Escribe el código de 6 dígitos').max(20) })

/** Estado de mi 2FA: si está activo, desde cuándo, cuántos códigos de respaldo me quedan y si es obligatorio */
users.get('/me/2fa', async (c) => {
  const me = c.get('admin')
  const [user, recoveryLeft] = await Promise.all([
    prisma.adminUser.findUnique({ where: { id: me.id }, select: { twoFactorAt: true } }),
    prisma.adminRecoveryCode.count({ where: { userId: me.id, usedAt: null } }),
  ])
  return c.json({ enabled: !!user?.twoFactorAt, enabledAt: user?.twoFactorAt ?? null, recoveryLeft, required: me.role === AdminRole.ADMIN })
})

/** Paso 1: clave nueva y su QR (si ya está activo, primero hay que quitarlo o pedir que lo restablezcan) */
users.post('/me/2fa/setup', async (c) => {
  const me = c.get('admin')
  if (me.twoFactor) return fail(c, 409, 'Ya tienes la verificación en dos pasos activa')
  if (!hasAppSecret()) return fail(c, 500, 'Falta APP_SECRET en .env: no se puede guardar la clave del 2FA')
  return c.json(await startSetup(me))
})

/** Paso 2: confirma con un código de la app; activa el 2FA, da los códigos de respaldo y cierra las demás sesiones */
users.post('/me/2fa/enable', async (c) => {
  const body = await parseBody(c, codeSchema)
  if (body instanceof Response) return body
  const me = await prisma.adminUser.findUnique({ where: { id: c.get('admin').id } })
  if (!me) return fail(c, 404, 'Usuario no encontrado')
  if (me.twoFactorAt) return fail(c, 409, 'Ya tienes la verificación en dos pasos activa')
  const step = checkPendingCode(me, body.code)
  if (step === null) return fail(c, 400, 'El código no coincide. Revisa que sea el de Hathor Frequency y que la hora del teléfono esté bien.', { code: 'No coincide' })
  await prisma.adminUser.update({ where: { id: me.id }, data: { twoFactorAt: new Date(), twoFactorLastStep: step } })
  const codes = await newRecoveryCodes(me.id)
  await prisma.adminSession.deleteMany({ where: { userId: me.id, id: { not: c.get('sessionId') } } })
  emitAdmin('users')
  return c.json({ codes })
})

/** Códigos de respaldo nuevos (los anteriores dejan de servir); pide un código de la app */
users.post('/me/2fa/recovery', async (c) => {
  const body = await parseBody(c, codeSchema)
  if (body instanceof Response) return body
  const me = await prisma.adminUser.findUnique({ where: { id: c.get('admin').id } })
  if (!me?.twoFactorAt) return fail(c, 400, 'Primero activa la verificación en dos pasos')
  if ((await verifySecondFactor(me, body.code)) !== 'app') return fail(c, 400, 'El código no coincide', { code: 'No coincide' })
  return c.json({ codes: await newRecoveryCodes(me.id) })
})

/** Quitar mi 2FA (solo Staff: para Admin es obligatorio); pide la contraseña */
users.delete('/me/2fa', async (c) => {
  const body = await parseBody(c, z.object({ password: z.string().min(1, 'Escribe tu contraseña') }))
  if (body instanceof Response) return body
  if (c.get('admin').role === AdminRole.ADMIN) return fail(c, 403, 'Para Admin la verificación en dos pasos es obligatoria')
  const me = await prisma.adminUser.findUnique({ where: { id: c.get('admin').id } })
  if (!me || !(await verifyPassword(body.password, me.passwordHash))) return fail(c, 400, 'La contraseña no es correcta', { password: 'No coincide' })
  await clearTwoFactor(me.id)
  emitAdmin('users')
  return c.json({ ok: true })
})

/** Registro de accesos: los últimos 100 intentos de login (solo el principal) */
users.get('/access-log', onlyRoot, async (c) =>
  c.json(
    await prisma.adminLoginEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, username: true, success: true, reason: true, ip: true, userAgent: true, createdAt: true, user: { select: { name: true } } },
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
  /** ADMIN: todo el panel · STAFF: solo sus vistas (`views`) y Mi cuenta */
  role: z.enum(AdminRole).optional(),
  /** Vistas del panel que ve si es STAFF (src/data/panelViews.ts) */
  views: z
    .array(z.enum(panelViewIds as [string, ...string[]]))
    .max(panelViewIds.length)
    .transform((v) => panelViewIds.filter((id) => v.includes(id)))
    .optional(),
  /** "YYYY-MM-DD": ese día la web festeja su cumpleaños; null = sin fecha */
  birthDate: z.iso
    .date('Fecha inválida')
    .refine((d) => d >= '1900-01-01' && d <= todayISO(), 'Fecha fuera de rango')
    .nullable()
    .optional(),
})

/** Fila de un usuario para el panel: la fecha de nacimiento como "YYYY-MM-DD" */
const toRow = <T extends { birthDate: Date | null; tempPassword: string | null; mustChangePassword: boolean }>(u: T) => ({
  ...u,
  birthDate: u.birthDate ? isoFromDate(u.birthDate) : null,
  // Solo mientras no la cambie: el principal la ve en claro para dársela
  tempPassword: u.mustChangePassword ? openTempPassword(u.tempPassword) : null,
})

/** Usuario libre para "jnunez": jnunez, o jnunez2, jnunez3… (sin contar el del propio usuario) */
async function freeUsername(base: string, exceptId?: string): Promise<string> {
  const taken = new Set(
    (await prisma.adminUser.findMany({ where: { username: { startsWith: base }, id: exceptId ? { not: exceptId } : undefined }, select: { username: true } })).map(
      (u) => u.username,
    ),
  )
  let username = base
  for (let n = 2; taken.has(username); n++) username = `${base}${n}`
  return username
}

users.get('/', onlyRoot, async (c) => {
  const rows = await prisma.adminUser.findMany({ select, orderBy: [{ isRoot: 'desc' }, { createdAt: 'asc' }] })
  // Solo se manda el bloqueo si sigue vigente
  const now = new Date()
  return c.json(rows.map((u) => toRow({ ...u, lockedUntil: u.lockedUntil && u.lockedUntil > now ? u.lockedUntil : null })))
})

users.post('/', onlyRoot, async (c) => {
  const body = await parseBody(c, profileSchema)
  if (body instanceof Response) return body
  // El usuario se genera: primera letra del primer nombre + primer apellido; si ya existe, jnunez2, jnunez3…
  const base = staffUsername(body.firstName, body.lastName)
  if (!base) return fail(c, 400, 'Datos inválidos', { firstName: 'Usa letras en el nombre y el apellido' })
  const username = await freeUsername(base)
  const temp = generateTempPassword()
  const user = await prisma.adminUser.create({
    data: {
      firstName: body.firstName,
      middleName: body.middleName || null,
      lastName: body.lastName,
      secondLastName: body.secondLastName || null,
      phone: body.phone,
      name: fullName({ ...body, middleName: body.middleName || undefined, secondLastName: body.secondLastName || undefined }),
      username,
      role: body.role ?? AdminRole.ADMIN,
      views: body.views ?? DEFAULT_STAFF_VIEWS,
      birthDate: body.birthDate ? dateFromISO(body.birthDate) : null,
      // La contraseña es temporal: se genera aquí y la persona la cambia en la bienvenida
      passwordHash: await hashPassword(temp),
      tempPassword: sealTempPassword(temp),
      mustChangePassword: true,
    },
    select,
  })
  emitAdmin('users')
  // La temporal va en claro esta vez aunque falte APP_SECRET (entonces no se vuelve a ver)
  return c.json({ ...toRow(user), tempPassword: temp }, 201)
})

/**
 * El principal edita el nombre y el teléfono de un usuario. Con `regenerateUsername`, el usuario se vuelve a armar
 * con el nombre nuevo (el del principal no cambia: es ROOT_ADMIN_USERNAME). Cambiar el usuario cierra sus sesiones.
 */
users.patch('/:id', onlyRoot, async (c) => {
  const body = await parseBody(c, profileSchema.extend({ regenerateUsername: z.boolean().optional() }))
  if (body instanceof Response) return body
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Usuario no encontrado')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  let username = user.username
  if (body.regenerateUsername && !user.isRoot) {
    const base = staffUsername(body.firstName, body.lastName)
    if (!base) return fail(c, 400, 'Datos inválidos', { firstName: 'Usa letras en el nombre y el apellido' })
    username = await freeUsername(base, id)
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
      username,
      // El principal siempre es ADMIN; el rol nuevo vale desde su siguiente petición
      role: user.isRoot ? AdminRole.ADMIN : (body.role ?? user.role),
      // Las vistas también valen desde su siguiente petición (su panel se actualiza con el aviso `users`)
      views: body.views ?? user.views,
      // Sin el campo, se queda la que tenía; null la borra
      birthDate: body.birthDate === undefined ? user.birthDate : body.birthDate ? dateFromISO(body.birthDate) : null,
    },
    select,
  })
  // Con otro usuario entra con el nuevo: sus sesiones se cierran (de la tuya, todas menos esta)
  if (username !== user.username) await prisma.adminSession.deleteMany({ where: { userId: id, id: { not: c.get('sessionId') } } })
  emitAdmin('users')
  return c.json(toRow(updated))
})

/** El principal le genera una contraseña temporal nueva (si la perdió): quita el bloqueo y cierra sus sesiones */
users.post('/:id/temp-password', onlyRoot, async (c) => {
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Usuario no encontrado')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  if (id === c.get('admin').id) return fail(c, 400, 'Tu propia contraseña cámbiala en Mi cuenta')
  const temp = generateTempPassword()
  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(temp), tempPassword: sealTempPassword(temp), mustChangePassword: true, failedLogins: 0, lockedUntil: null },
  })
  await prisma.adminSession.deleteMany({ where: { userId: id } })
  emitAdmin('users')
  return c.json({ tempPassword: temp })
})

/**
 * El principal le quita el 2FA a alguien que perdió el teléfono y sus códigos: se cierran sus sesiones y, al volver
 * a entrar, lo activa de nuevo (si es Admin, es lo primero que le pide el panel). El suyo se restablece con
 * `npm run admin:reset-2fa` desde la terminal.
 */
users.post('/:id/2fa/reset', onlyRoot, async (c) => {
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Usuario no encontrado')
  if (id === c.get('admin').id) return fail(c, 400, 'El tuyo se restablece desde la terminal: npm run admin:reset-2fa')
  const user = await prisma.adminUser.findUnique({ where: { id } })
  if (!user) return fail(c, 404, 'Usuario no encontrado')
  await clearTwoFactor(id)
  await prisma.adminSession.deleteMany({ where: { userId: id } })
  emitAdmin('users')
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
