import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { timePattern } from '../../../src/data/booking'
import { normalizeUsername } from '../../../src/data/staff'
import { DUMMY_HASH, endSession, requireAdmin, requireRole, startSession, userAgentOf, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { BookingStatus, PaymentStatus, ReviewStatus } from '../../generated/prisma/enums'
import type { AdminUser, Booking } from '../../generated/prisma/client'
import { parseBody } from '../../shared/lib/body'
import { dateFromISO, isoFromDate, todayISO } from '../../shared/lib/dates'
import { fail, invalid } from '../../shared/lib/errors'
import { isUniqueViolation } from '../../shared/lib/prismaErrors'
import { clientIp, rateLimit } from '../../shared/lib/rateLimit'
import { serviceLabel } from '../../shared/lib/services'
import { dashboard } from './dashboard'
import { adminContent, contentChanges } from './content'
import { MEDIA_DIR, listMedia, mediaExists, searchMedia } from '../../shared/lib/media'
import { broadcastStats } from '../../shared/lib/stats'
import { POLL_WAIT_MS, adminFeed, emitAdmin, emitAvailability, emitLive, onAdminEvent } from '../../shared/lib/siteEvents'
import { streamSSE } from 'hono/streaming'
import { adminSite } from './site'
import { users } from './users'
import { dedications } from './dedications'
import { adminPlugins } from './plugins'
import { readPass, signPass } from '../lib/secretBox'
import { verifySecondFactor } from '../lib/twoFactor'
import { publishedDisabled } from '../../shared/lib/site'
import { getMaintenance } from '../../shared/lib/maintenance'
import { birthdaysToday, isBirthdayToday } from '../../shared/lib/birthdays'
import { bookingSlots } from '../../shared/lib/slots'
import { isBlocked } from '../../shared/lib/availability'
import { serviceFromLabel } from '../../shared/lib/services'
import { adminBookingSchema } from '../../shared/schemas'

export const admin = new Hono<{ Variables: AdminVariables }>()

// ── Sesión ────────────────────────────────────────────────

// Se entra con el usuario ("fruiz"); si escriben el correo de antes, se toma lo de antes de la @
const loginSchema = z.object({ username: z.string().max(254).transform(normalizeUsername), password: z.string().min(1).max(200) })
/** Intentos fallidos seguidos antes de bloquear la cuenta, y por cuánto */
const LOCK_AFTER = 5
const LOCK_MS = 15 * 60_000

/** Lo que recibe el panel al entrar */
const loginUser = (user: AdminUser) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  isRoot: user.isRoot,
  role: user.role,
  views: user.views,
  twoFactor: !!user.twoFactorAt,
  birthday: isBirthdayToday(user.birthDate),
  mustChangePassword: user.mustChangePassword,
  guidesSeen: user.guidesSeen,
})

type LoginReason = 'password' | 'unknown' | 'locked' | 'code' | 'recovery' | null
const logLogin = (c: Context, username: string, success: boolean, userId: string | null, reason: LoginReason) =>
  prisma.adminLoginEvent.create({ data: { username: username.slice(0, 254), userId, success, reason, ip: clientIp(c), userAgent: userAgentOf(c) } })

/** Un fallo más (contraseña o código): al llegar a LOCK_AFTER la cuenta se bloquea LOCK_MS */
async function countFailure(user: AdminUser) {
  const failed = user.failedLogins + 1
  const lock = failed >= LOCK_AFTER
  await prisma.adminUser.update({
    where: { id: user.id },
    data: lock ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: failed },
  })
}

/** Entra: limpia los fallos, abre la sesión y lo anota */
async function finishLogin(c: Context, user: AdminUser, reason: LoginReason) {
  if (user.failedLogins || user.lockedUntil) await prisma.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } })
  await startSession(c, user.id, clientIp(c))
  await logLogin(c, user.username, true, user.id, reason)
  // El registro guarda 90 días
  void prisma.adminLoginEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86_400_000) } } }).catch(() => {})
  emitAdmin('users')
  return c.json(loginUser(user))
}

const lockedFor = (user: AdminUser) => Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60_000)

/** Pase del segundo paso del login (2FA): firmado con APP_SECRET, vale 5 minutos */
const TICKET = 'login-2fa'
const TICKET_MS = 5 * 60_000

admin.post('/login', rateLimit({ max: 10, windowMs: 15 * 60_000 }), async (c) => {
  const body = await parseBody(c, loginSchema)
  if (body instanceof Response) return body

  const user = await prisma.adminUser.findUnique({ where: { username: body.username } })
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await logLogin(c, body.username, false, user.id, 'locked')
    return fail(c, 429, `Demasiados intentos fallidos. Intenta de nuevo en ${lockedFor(user)} min.`)
  }
  // Con un usuario que no existe también se compara una contraseña, para que tarde lo mismo
  const ok = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) {
    if (user) await countFailure(user)
    await logLogin(c, body.username, false, user?.id ?? null, user ? 'password' : 'unknown')
    return fail(c, 401, 'Usuario o contraseña incorrectos')
  }
  // Con 2FA, la contraseña sola no abre sesión: falta el código (los fallos no se limpian hasta entrar)
  if (user.twoFactorAt) {
    const ticket = signPass(TICKET, user.id, TICKET_MS)
    if (!ticket) return fail(c, 500, 'Falta APP_SECRET en .env: no se puede verificar el segundo paso')
    return c.json({ twoFactor: true, ticket })
  }
  return finishLogin(c, user, null)
})

/** Segundo paso del login: código de la app (6 dígitos) o de respaldo, con el pase del primer paso */
admin.post('/login/2fa', rateLimit({ max: 10, windowMs: 15 * 60_000 }), async (c) => {
  const body = await parseBody(c, z.object({ ticket: z.string().max(400), code: z.string().trim().min(6, 'Escribe el código').max(20) }))
  if (body instanceof Response) return body
  const userId = readPass(TICKET, body.ticket)
  const user = userId ? await prisma.adminUser.findUnique({ where: { id: userId } }) : null
  if (!user?.twoFactorAt) return fail(c, 401, 'Pasaron más de 5 minutos. Vuelve a escribir tu contraseña.')
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logLogin(c, user.username, false, user.id, 'locked')
    return fail(c, 429, `Demasiados intentos fallidos. Intenta de nuevo en ${lockedFor(user)} min.`)
  }
  const used = await verifySecondFactor(user, body.code)
  if (!used) {
    await countFailure(user)
    await logLogin(c, user.username, false, user.id, 'code')
    return fail(c, 401, 'Código incorrecto', { code: 'No coincide' })
  }
  return finishLogin(c, user, used === 'recovery' ? 'recovery' : null)
})

admin.post('/logout', async (c) => {
  await endSession(c)
  return c.json({ ok: true })
})

// Todo lo de abajo exige sesión, y el rol STAFF solo llega a sus vistas (src/data/panelViews.ts) y su cuenta
admin.use('*', requireAdmin)
admin.use('*', requireRole)

admin.get('/me', (c) => c.json(c.get('admin')))

/** GET /api/admin/events: SSE con un evento `admin` (data = qué cambió) para que el panel se actualice solo */
admin.get('/events', (c) => {
  c.header('X-Accel-Buffering', 'no')
  return streamSSE(c, async (stream) => {
    let closed = false
    const off = onAdminEvent((kind) => void stream.writeSSE({ event: 'admin', data: kind }))
    stream.onAbort(() => {
      closed = true
      off()
    })
    await stream.write(`:${' '.repeat(2048)}\n\n`)
    await stream.writeSSE({ event: 'hello', data: '', retry: 5000 })
    while (!closed) {
      await stream.sleep(25_000)
      if (!closed) await stream.writeSSE({ event: 'ping', data: '' })
    }
  })
})

/** GET /api/admin/events/poll?boot=&after=: respaldo del SSE por long-polling (igual que /api/site/events/poll) */
admin.get('/events/poll', async (c) => {
  c.header('Cache-Control', 'no-store')
  const after = Number(c.req.query('after') ?? -1)
  return c.json(await adminFeed.since(c.req.query('boot') ?? '', Number.isInteger(after) ? after : -1, POLL_WAIT_MS, c.req.raw.signal))
})

/** Contadores de las pestañas del panel */
admin.get('/summary', async (c) => {
  const [pendingBookings, pendingReviews, openContacts, draft, published, contentDirty, maintenance, birthdays] = await Promise.all([
    prisma.booking.count({ where: { status: BookingStatus.PENDING, date: { gte: dateFromISO(todayISO()) } } }),
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.contactRequest.count({ where: { handledAt: null } }),
    prisma.siteDraft.findUnique({ where: { id: 1 }, select: { disabled: true } }),
    publishedDisabled(),
    contentChanges(),
    getMaintenance(),
    birthdaysToday(),
  ])
  // Cambios del panel · Sitio sin publicar
  const d = draft?.disabled ?? published.disabled
  const siteChanges = d.filter((id) => !published.disabled.includes(id)).length + published.disabled.filter((id) => !d.includes(id)).length
  // El rol STAFF solo ve sus contadores
  // Plugins se edita en su propia sección del panel: su punto va en esa pestaña, no en Contenido
  const pluginChanges = contentDirty.includes('plugins') ? 1 : 0
  const counts = { pendingBookings, pendingReviews, openContacts, siteChanges, contentChanges: contentDirty.length - pluginChanges, pluginChanges }
  // El rol STAFF solo ve los contadores de sus vistas
  const { role, views } = c.get('admin')
  if (role === 'STAFF') {
    const has = (v: string) => views.includes(v)
    return c.json({
      pendingBookings: has('agenda') ? counts.pendingBookings : 0,
      pendingReviews: has('opiniones') ? counts.pendingReviews : 0,
      openContacts: has('contactos') ? counts.openContacts : 0,
      siteChanges: has('sitio') ? counts.siteChanges : 0,
      contentChanges: has('contenido') ? counts.contentChanges : 0,
      pluginChanges: has('plugins') ? counts.pluginChanges : 0,
      maintenance,
      birthdays,
    })
  }
  return c.json({ ...counts, maintenance, birthdays })
})

// ── Reservas ──────────────────────────────────────────────

const bookingFilters = z.object({
  status: z.enum(BookingStatus).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
})

/** Reserva para el panel: fecha "YYYY-MM-DD", servicio con su etiqueta y montos en pesos */
export const toAdminBooking = ({ amountCents, depositCents, ...b }: Booking) => ({
  ...b,
  date: isoFromDate(b.date),
  service: serviceLabel[b.service],
  amount: amountCents === null ? null : amountCents / 100,
  deposit: depositCents === null ? null : depositCents / 100,
})

/** Minúsculas y sin acentos, para buscar "sofia" y encontrar "Sofía" */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * GET /api/admin/bookings/search?q=: reservas de cualquier fecha por proyecto, nombre, teléfono, correo o servicio
 * (sin importar acentos). Primero las próximas (de la más cercana) y luego las pasadas (de la más reciente); máx. 20.
 */
admin.get('/bookings/search', async (c) => {
  const q = z.string().trim().min(2, 'Escribe al menos 2 letras').max(80).safeParse(c.req.query('q') ?? '')
  if (!q.success) return invalid(c, q.error)
  const needle = fold(q.data)
  const digits = q.data.replace(/\D/g, '')
  const rows = await prisma.booking.findMany({ orderBy: [{ date: 'desc' }, { startTime: 'desc' }], take: 5000 })
  const hits = rows.filter(
    (b) =>
      fold(`${b.project} ${b.representativeName} ${b.email} ${serviceLabel[b.service]}`).includes(needle) ||
      (digits.length >= 3 && b.phone.replace(/\D/g, '').includes(digits)),
  )
  const today = dateFromISO(todayISO()).getTime()
  const upcoming = hits.filter((b) => b.date.getTime() >= today).reverse()
  const past = hits.filter((b) => b.date.getTime() < today)
  return c.json([...upcoming, ...past].slice(0, 20).map(toAdminBooking))
})

admin.get('/bookings', async (c) => {
  const q = bookingFilters.safeParse(c.req.query())
  if (!q.success) return invalid(c, q.error)
  const { status, from, to } = q.data
  const rows = await prisma.booking.findMany({
    where: {
      status,
      date: from || to ? { gte: from ? dateFromISO(from) : undefined, lte: to ? dateFromISO(to) : undefined } : undefined,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 500,
  })
  return c.json(rows.map(toAdminBooking))
})

/** El estudio agenda una sesión sin pasar por la web (confirmada por defecto) */
admin.post('/bookings', async (c) => {
  const body = await parseBody(c, adminBookingSchema)
  if (body instanceof Response) return body
  const { date, time, service, representativeType, status, email, ...contact } = body
  if (!(await bookingSlots()).includes(time)) return fail(c, 400, 'Datos inválidos', { time: 'No es una hora de inicio' })
  const day = dateFromISO(date)
  if (await isBlocked(day, time)) return fail(c, 409, 'Ese horario está bloqueado. Libéralo primero en la agenda.')
  try {
    const b = await prisma.booking.create({
      data: {
        ...contact,
        email: email ?? '',
        date: day,
        startTime: time,
        status,
        service: serviceFromLabel[service],
        representativeType: representativeType === 'integrante' ? 'INTEGRANTE' : 'EXTERNO',
      },
    })
    emitAdmin('booking')
    emitAvailability()
    return c.json(toAdminBooking(b), 201)
  } catch (err) {
    if (isUniqueViolation(err)) return fail(c, 409, 'Ese horario ya tiene una reserva')
    throw err
  }
})

const pesos = z.number().min(0).max(10_000_000)
const toCents = (n: number | null | undefined) => (n === undefined ? undefined : n === null ? null : Math.round(n * 100))

/** Estado de la reserva y, desde la ventana de cobro, monto, pago y anticipo (en pesos) */
const bookingPatch = z
  .object({
    status: z.enum(BookingStatus).optional(),
    amount: pesos.nullable().optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
    deposit: pesos.nullable().optional(),
  })
  .refine((b) => b.deposit == null || b.amount == null || b.deposit <= b.amount, {
    message: 'El anticipo no puede ser mayor que el monto',
    path: ['deposit'],
  })

admin.patch('/bookings/:id', async (c) => {
  const body = await parseBody(c, bookingPatch)
  if (body instanceof Response) return body
  const { status, amount, paymentStatus, deposit } = body
  try {
    const b = await prisma.booking.update({
      where: { id: c.req.param('id') },
      data: {
        status,
        amountCents: toCents(amount),
        paymentStatus,
        // El anticipo solo aplica con pago "Anticipo"; pagada guarda la fecha
        depositCents: paymentStatus === undefined ? toCents(deposit) : paymentStatus === 'DEPOSIT' ? toCents(deposit) ?? null : null,
        paidAt: paymentStatus === undefined ? undefined : paymentStatus === 'PAID' ? new Date() : null,
      },
    })
    // Terminar o reabrir una sesión cambia la cifra de proyectos
    if (status) void broadcastStats()
    emitAdmin('booking')
    emitAvailability()
    return c.json(toAdminBooking(b))
  } catch (err) {
    // Reactivar una cancelada cuando su horario ya lo tomó otra reserva
    if (isUniqueViolation(err)) return fail(c, 409, 'Ese horario ya tiene otra reserva activa')
    if ((err as { code?: string }).code === 'P2025') return fail(c, 404, 'Reserva no encontrada')
    throw err
  }
})

// ── Opiniones ─────────────────────────────────────────────

admin.get('/reviews', async (c) => {
  const status = z.enum(ReviewStatus).optional().safeParse(c.req.query('status'))
  if (!status.success) return invalid(c, status.error)
  return c.json(await prisma.review.findMany({ where: { status: status.data }, orderBy: { createdAt: 'desc' }, take: 500 }))
})

admin.patch('/reviews/:id', async (c) => {
  const body = await parseBody(c, z.object({ status: z.enum(ReviewStatus) }))
  if (body instanceof Response) return body
  try {
    const r = await prisma.review.update({ where: { id: c.req.param('id') }, data: { status: body.status } })
    emitAdmin('review')
    // Publicar u ocultar cambia la página Opiniones abierta
    emitLive('reviews', {})
    return c.json(r)
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return fail(c, 404, 'Opinión no encontrada')
    throw err
  }
})

admin.delete('/reviews/:id', async (c) => {
  const id = c.req.param('id')
  if (!z.uuid().safeParse(id).success) return fail(c, 404, 'Opinión no encontrada')
  const { count } = await prisma.review.deleteMany({ where: { id } })
  if (!count) return fail(c, 404, 'Opinión no encontrada')
  emitAdmin('review')
  emitLive('reviews', {})
  return c.json({ ok: true })
})

// ── Contactos ─────────────────────────────────────────────

admin.get('/contacts', async (c) =>
  c.json(await prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })),
)

admin.patch('/contacts/:id', async (c) => {
  const body = await parseBody(c, z.object({ handled: z.boolean() }))
  if (body instanceof Response) return body
  try {
    const row = await prisma.contactRequest.update({
      where: { id: c.req.param('id') },
      data: { handledAt: body.handled ? new Date() : null },
    })
    emitAdmin('contact')
    return c.json(row)
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return fail(c, 404, 'Contacto no encontrado')
    throw err
  }
})

// ── Bloqueos de horario ───────────────────────────────────

const blockSchema = z.object({
  date: z.iso.date('Fecha inválida'),
  /** Sin hora = el día completo */
  time: z.string().regex(timePattern, 'Hora inválida').optional(),
  reason: z.string().trim().max(120).optional(),
})

const rangeSchema = z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() })

admin.get('/blocks', async (c) => {
  const q = rangeSchema.safeParse(c.req.query())
  if (!q.success) return invalid(c, q.error)
  const { from, to } = q.data
  const rows = await prisma.blockedSlot.findMany({
    where: from || to ? { date: { gte: from ? dateFromISO(from) : undefined, lte: to ? dateFromISO(to) : undefined } } : undefined,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
  return c.json(rows.map((b) => ({ ...b, date: isoFromDate(b.date) })))
})

admin.post('/blocks', async (c) => {
  const body = await parseBody(c, blockSchema)
  if (body instanceof Response) return body
  if (body.time && !(await bookingSlots()).includes(body.time)) return fail(c, 400, 'Datos inválidos', { time: 'No es una hora de inicio' })
  try {
    const b = await prisma.blockedSlot.create({
      data: { date: dateFromISO(body.date), startTime: body.time ?? null, reason: body.reason || null },
    })
    emitAdmin('block')
    emitAvailability()
    return c.json({ ...b, date: isoFromDate(b.date) }, 201)
  } catch (err) {
    if (isUniqueViolation(err)) return fail(c, 409, 'Ese bloqueo ya existe')
    throw err
  }
})

admin.delete('/blocks/:id', async (c) => {
  const { count } = await prisma.blockedSlot.deleteMany({ where: { id: c.req.param('id') } })
  if (!count) return fail(c, 404, 'Bloqueo no encontrado')
  emitAdmin('block')
  emitAvailability()
  return c.json({ ok: true })
})

// ── Dashboard (Inicio) ────────────────────────────────────

admin.route('/dashboard', dashboard)

// ── Sitio (módulos) ───────────────────────────────────────

admin.route('/site', adminSite)

// ── Usuarios del panel ────────────────────────────────────

admin.route('/users', users)

// ── Dedicatorias de cumpleaños ────────────────────────────

admin.route('/dedications', dedications)

// ── Medios (F1: ¿existe la ruta en el HDD?) ───────────────

/** Buscador de archivos: ?dir=/media/artistas para navegar o ?q=ralo para buscar por nombre */
admin.get('/media/list', async (c) => {
  if (!MEDIA_DIR) return c.json({ configured: false, dir: '/media', parent: null, entries: [] })
  const q = c.req.query('q')
  if (q) return c.json({ configured: true, dir: '/media', parent: null, query: q, entries: await searchMedia(q) })
  const res = await listMedia(c.req.query('dir') ?? '/media')
  if (!res) return fail(c, 404, 'Carpeta no encontrada')
  return c.json({ configured: true, ...res })
})

admin.get('/media/check', async (c) => {
  const path = c.req.query('path') ?? ''
  return c.json({ path, exists: await mediaExists(path) })
})

// ── Contenido ─────────────────────────────────────────────

admin.route('/content', adminContent)

// ── Plugins (versiones y descargas; la ficha es el contenido `plugins`) ──

admin.route('/plugins', adminPlugins)
