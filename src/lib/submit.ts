/**
 * Punto único de envío de formularios.
 * Hoy solo simula el envío; cuando exista la API (Prisma + PostgreSQL),
 * reemplazar el cuerpo de estas funciones por un `fetch` al endpoint.
 */

/** Quién es el representante: alguien de la banda o una persona externa (mánager, productor…) */
export type RepresentativeType = 'integrante' | 'externo'

/** Datos de contacto que pide Reservar */
export interface BookingContact {
  /** Nombre de la banda o proyecto */
  project: string
  representativeType: RepresentativeType
  representativeName: string
  phone: string
  email: string
}

export interface BookingRequest extends BookingContact {
  /** Fecha local en formato YYYY-MM-DD */
  date: string
  /** Hora de inicio HH:MM */
  time: string
  service: string
}

const fakeLatency = () => new Promise((resolve) => setTimeout(resolve, 400))

export async function submitContact(email: string): Promise<void> {
  await fakeLatency()
  console.info('[submitContact]', { email })
}

export async function submitBooking(data: BookingRequest): Promise<void> {
  await fakeLatency()
  console.info('[submitBooking]', data)
}
