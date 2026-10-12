import { bookingServices } from '../../../src/data/booking'
import { Service } from '../../generated/prisma/enums'

type BookingService = (typeof bookingServices)[number]

/** Etiqueta del frontend (src/data/booking.ts) ↔ enum `Service` de la BD */
export const serviceFromLabel: Record<BookingService, Service> = {
  Grabación: Service.GRABACION,
  Mezcla: Service.MEZCLA,
  Masterización: Service.MASTERIZACION,
  Video: Service.VIDEO,
  'Live Sessions': Service.LIVE_SESSIONS,
}

export const serviceLabel = Object.fromEntries(
  Object.entries(serviceFromLabel).map(([label, value]) => [value, label]),
) as Record<Service, BookingService>
