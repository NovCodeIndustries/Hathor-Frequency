import { Hono } from 'hono'
import { z } from 'zod'
import { timeSlots } from '../../src/data/booking'
import { endSession, requireAdmin, startSession, verifyPassword, type AdminVariables } from '../auth'
import { prisma } from '../db'
import { BookingStatus, ReviewStatus } from '../generated/prisma/enums'
import { parseBody } from '../lib/body'
import { dateFromISO, isoFromDate, todayISO } from '../lib/dates'
import { fail, invalid } from '../lib/errors'
import { isUniqueViolation } from '../lib/prismaErrors'
import { rateLimit } from '../lib/rateLimit'
import { serviceLabel } from '../lib/services'

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
  const [pendingBookings, pendingReviews, openContacts] = await Promise.all([
    prisma.booking.count({ where: { status: BookingStatus.PENDING, date: { gte: dateFromISO(todayISO()) } } }),
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.contactRequest.count({ where: { handledAt: null } }),
  ])
  return c.json({ pendingBookings, pendingReviews, openContacts })
})

// ── Reservas ──────────────────────────────────────────────

const bookingFilters = z.object({
  status: z.enum(BookingStatus).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
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
  return c.json(rows.map((b) => ({ ...b, date: isoFromDate(b.date), service: serviceLabel[b.service] })))
})

admin.patch('/bookings/:id', async (c) => {
  const body = await parseBody(c, z.object({ status: z.enum(BookingStatus) }))
  if (body instanceof Response) return body
  try {
    const b = await prisma.booking.update({ where: { id: c.req.param('id') }, data: { status: body.status } })
    return c.json({ ...b, date: isoFromDate(b.date), service: serviceLabel[b.service] })
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
