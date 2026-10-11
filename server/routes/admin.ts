import { Hono } from 'hono'
import { z } from 'zod'
import { timeSlots } from '../../src/data/booking'
import { endSession, requireAdmin, startSession, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../db'
import { BookingStatus, PaymentStatus, ReviewStatus } from '../generated/prisma/enums'
import type { Booking } from '../generated/prisma/client'
import { parseBody } from '../lib/body'
import { dateFromISO, isoFromDate, todayISO } from '../lib/dates'
import { fail, invalid } from '../lib/errors'
import { isUniqueViolation } from '../lib/prismaErrors'
import { rateLimit } from '../lib/rateLimit'
import { serviceLabel } from '../lib/services'
import { dashboard } from './dashboard'
import { adminContent, contentChanges } from './content'
import { mediaExists } from '../lib/media'
import { adminSite } from './site'
import { publishedDisabled } from '../lib/site'

export const admin = new Hono<{ Variables: AdminVariables }>()

// ── Sesión ────────────────────────────────────────────────

const loginSchema = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1) })

admin.post('/login', rateLimit({ max: 10, windowMs: 15 * 60_000 }), async (c) => {
  const body = await parseBody(c, loginSchema)
  if (body instanceof Response) return body
  const user = await prisma.adminUser.findUnique({ where: { email: body.email } })
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return fail(c, 401, 'Correo o contraseña incorrectos')
  }
  await startSession(c, user.id)
  return c.json({ id: user.id, email: user.email, name: user.name })
})

admin.post('/logout', async (c) => {
  await endSession(c)
  return c.json({ ok: true })
})

// Todo lo de abajo exige sesión
admin.use('*', requireAdmin)

admin.get('/me', (c) => c.json(c.get('admin')))

/** Contadores de las pestañas del panel */
admin.get('/summary', async (c) => {
  const [pendingBookings, pendingReviews, openContacts, draft, published, contentDirty] = await Promise.all([
    prisma.booking.count({ where: { status: BookingStatus.PENDING, date: { gte: dateFromISO(todayISO()) } } }),
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.contactRequest.count({ where: { handledAt: null } }),
    prisma.siteDraft.findUnique({ where: { id: 1 }, select: { disabled: true } }),
    publishedDisabled(),
    contentChanges(),
  ])
  // Cambios del panel · Sitio sin publicar
  const d = draft?.disabled ?? published.disabled
  const siteChanges = d.filter((id) => !published.disabled.includes(id)).length + published.disabled.filter((id) => !d.includes(id)).length
  return c.json({ pendingBookings, pendingReviews, openContacts, siteChanges, contentChanges: contentDirty.length })
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
    return c.json(await prisma.review.update({ where: { id: c.req.param('id') }, data: { status: body.status } }))
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return fail(c, 404, 'Opinión no encontrada')
    throw err
  }
})

// ── Contactos ─────────────────────────────────────────────

admin.get('/contacts', async (c) =>
  c.json(await prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })),
)

admin.patch('/contacts/:id', async (c) => {
  const body = await parseBody(c, z.object({ handled: z.boolean() }))
  if (body instanceof Response) return body
  try {
    return c.json(
      await prisma.contactRequest.update({
        where: { id: c.req.param('id') },
        data: { handledAt: body.handled ? new Date() : null },
      }),
    )
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return fail(c, 404, 'Contacto no encontrado')
    throw err
  }
})

// ── Bloqueos de horario ───────────────────────────────────

const blockSchema = z.object({
  date: z.iso.date('Fecha inválida'),
  /** Sin hora = el día completo */
  time: z.enum(timeSlots).optional(),
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
  try {
    const b = await prisma.blockedSlot.create({
      data: { date: dateFromISO(body.date), startTime: body.time ?? null, reason: body.reason || null },
    })
    return c.json({ ...b, date: isoFromDate(b.date) }, 201)
  } catch (err) {
    if (isUniqueViolation(err)) return fail(c, 409, 'Ese bloqueo ya existe')
    throw err
  }
})

admin.delete('/blocks/:id', async (c) => {
  const { count } = await prisma.blockedSlot.deleteMany({ where: { id: c.req.param('id') } })
  return count ? c.json({ ok: true }) : fail(c, 404, 'Bloqueo no encontrado')
})

// ── Dashboard (Inicio) ────────────────────────────────────

admin.route('/dashboard', dashboard)

// ── Sitio (módulos) ───────────────────────────────────────

admin.route('/site', adminSite)

// ── Medios (F1: ¿existe la ruta en el HDD?) ───────────────

admin.get('/media/check', async (c) => {
  const path = c.req.query('path') ?? ''
  return c.json({ path, exists: await mediaExists(path) })
})

// ── Contenido ─────────────────────────────────────────────

admin.route('/content', adminContent)
