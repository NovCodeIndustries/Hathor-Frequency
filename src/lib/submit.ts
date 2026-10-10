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

/** Datos que pide Contacto */
export interface ContactRequest {
  /** Nombre de quien pide la información */
  name: string
  /** Tema sobre el que quiere información (`contactTopics`) */
  topic: string
  email: string
}

export async function submitContact(data: ContactRequest): Promise<void> {
  await fakeLatency()
  console.info('[submitContact]', data)
}

export async function submitBooking(data: BookingRequest): Promise<void> {
  await fakeLatency()
  console.info('[submitBooking]', data)
}

/** Opinión enviada desde la ventana "Deja tu opinión" (queda pendiente de revisión) */
export interface ReviewRequest {
  rating: number
  name: string
  project: string
  service: string
  text: string
  /** Autoriza publicarla con su nombre */
  consent: boolean
}

export async function submitReview(data: ReviewRequest): Promise<void> {
  await fakeLatency()
  console.info('[submitReview]', data)
}
