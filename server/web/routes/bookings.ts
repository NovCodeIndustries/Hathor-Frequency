import { Hono } from 'hono'
import { prisma } from '../../shared/db'
import { isBlocked } from '../../shared/lib/availability'
import { parseBody } from '../../shared/lib/body'
import { dateFromISO } from '../../shared/lib/dates'
import { fail } from '../../shared/lib/errors'
import { isUniqueViolation } from '../../shared/lib/prismaErrors'
import { serviceFromLabel } from '../../shared/lib/services'
import { bookingSlots } from '../../shared/lib/slots'
import { bookingSchema } from '../../shared/schemas'
import { emitAdmin, emitAvailability } from '../../shared/lib/siteEvents'

/** Mensaje cuando el horario ya no está libre (el frontend lo muestra tal cual) */
const SLOT_TAKEN = 'Ese horario acaba de ocuparse. Elige otro.'

export const bookings = new Hono()

bookings.post('/', async (c) => {
  const body = await parseBody(c, bookingSchema)
  if (body instanceof Response) return body
  const { website, date, time, service, representativeType, ...contact } = body
  if (website) return c.json({ ok: true }, 201)

  if (!(await bookingSlots()).includes(time)) return fail(c, 400, 'Datos inválidos', { time: 'Ese horario ya no está disponible. Elige otro.' })

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
  // El panel ve la reserva nueva y los demás visitantes ven el horario ocupado, al instante
  emitAdmin('booking')
  emitAvailability()
  return c.json({ ok: true }, 201)
})
