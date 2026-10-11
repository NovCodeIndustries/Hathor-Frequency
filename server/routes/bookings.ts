import { Hono } from 'hono'
import { prisma } from '../db'
import { availabilityBetween, isBlocked } from '../lib/availability'
import { parseBody } from '../lib/body'
import { dateFromISO, monthRange } from '../lib/dates'
import { fail, invalid } from '../lib/errors'
import { isUniqueViolation } from '../lib/prismaErrors'
import { serviceFromLabel } from '../lib/services'
import { bookingSchema, monthSchema } from '../schemas'

/** Mensaje cuando el horario ya no está libre (el frontend lo muestra tal cual) */
const SLOT_TAKEN = 'Ese horario acaba de ocuparse. Elige otro.'

export const bookings = new Hono()

bookings.post('/', async (c) => {
  const body = await parseBody(c, bookingSchema)
  if (body instanceof Response) return body
  const { website, date, time, service, representativeType, ...contact } = body
  if (website) return c.json({ ok: true }, 201)

  const day = dateFromISO(date)
  if (await isBlocked(day, time)) return fail(c, 409, SLOT_TAKEN)

  try {
    await prisma.booking.create({
      data: {
        ...contact,
        date: day,
        startTime: time,
        service: serviceFromLabel[service],
        representativeType: representativeType === 'integrante' ? 'INTEGRANTE' : 'EXTERNO',
      },
    })
  } catch (err) {
    // El índice único parcial (fecha, hora) evita la reserva doble aunque lleguen dos a la vez
    if (isUniqueViolation(err)) return fail(c, 409, SLOT_TAKEN)
    throw err
  }
  return c.json({ ok: true }, 201)
})

/** GET /api/availability?month=YYYY-MM */
export const availability = new Hono()

availability.get('/', async (c) => {
  const month = monthSchema.safeParse(c.req.query('month'))
  if (!month.success) return invalid(c, month.error)
  const { from, to } = monthRange(month.data)
  return c.json(await availabilityBetween(from, to))
})
