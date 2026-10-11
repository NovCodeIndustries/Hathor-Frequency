/**
 * Punto único de envío de formularios: `fetch` a la API (server/, Hono).
 * En dev, Vite pasa `/api` al servidor (vite.config.ts · proxy).
 */

/** Error de la API con su código HTTP y, si falló la validación, el mensaje de cada campo */
export class SubmitError extends Error {
  status: number
  fields?: Record<string, string>

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

/** Honeypot (`components/shared/Honeypot`): una persona lo deja vacío */
interface Trap {
  website?: string
}

async function post(path: string, data: object): Promise<void> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw new SubmitError(0, 'Sin conexión')
  }
  if (res.ok) return
  const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> }
  throw new SubmitError(res.status, body.error ?? 'Error del servidor', body.fields)
}

/**
 * Texto para el usuario: los mensajes de la API que tienen sentido mostrar
 * (horario ocupado, demasiados intentos, dato inválido) o el genérico del formulario.
 */
export function submitErrorText(err: unknown, fallback: string): string {
  if (!(err instanceof SubmitError)) return fallback
  if (err.status === 409 || err.status === 429) return err.message
  if (err.status === 400 && err.fields) return `Revisa los datos: ${Object.values(err.fields)[0]}.`
  return fallback
}

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

export interface BookingRequest extends BookingContact, Trap {
  /** Fecha local en formato YYYY-MM-DD */
  date: string
  /** Hora de inicio HH:MM */
  time: string
  service: string
}

/** Datos que pide Contacto */
export interface ContactRequest extends Trap {
  /** Nombre de quien pide la información */
  name: string
  /** Tema sobre el que quiere información (`contactTopics`) */
  topic: string
  email: string
}

export const submitContact = (data: ContactRequest) => post('/contact', data)

/** Responde 409 (`SubmitError`) si el horario se ocupó o el estudio lo cerró */
export const submitBooking = (data: BookingRequest) => post('/bookings', data)

/** Opinión enviada desde la ventana "Deja tu opinión" (queda pendiente de revisión) */
export interface ReviewRequest extends Trap {
  rating: number
  name: string
  project: string
  service: string
  text: string
  /** Autoriza publicarla con su nombre */
  consent: boolean
}

export const submitReview = (data: ReviewRequest) => post('/reviews', data)
