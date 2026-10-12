import { z } from 'zod'
import { bookingServices, timePattern } from '../src/data/booking'
import { reviewMaxLength } from '../src/data/reviews'
import { contactTopics } from '../src/data/site'
import { todayISO } from './lib/dates'

const text = (max: number, msg = 'Campo obligatorio') => z.string().trim().min(1, msg).max(max, `Máximo ${max} caracteres`)
const email = z.string().trim().max(254).pipe(z.email('Correo inválido'))
const isoDate = z.iso.date('Fecha inválida')

/**
 * Honeypot: campo oculto que una persona deja vacío.
 * Si llega con texto, la ruta responde OK sin guardar nada.
 */
export const honeypot = { website: z.string().optional() }

export const contactSchema = z.object({
  name: text(120),
  topic: z.enum(contactTopics, 'Elige un tema'),
  email,
  ...honeypot,
})

export const bookingSchema = z.object({
  date: isoDate.refine((d) => d >= todayISO(), 'La fecha ya pasó'),
  /** Que sea una hora de inicio publicada lo revisa la ruta (`bookingSlots`) */
  time: z.string().regex(timePattern, 'Horario inválido'),
  service: z.enum(bookingServices, 'Servicio inválido'),
  project: text(120),
  representativeType: z.enum(['integrante', 'externo']),
  representativeName: text(120),
  phone: z.string().trim().regex(/^[\d+()\s-]{8,20}$/, 'Teléfono inválido'),
  email,
  ...honeypot,
})

/** Sesión que agenda el estudio desde el panel (llamada, WhatsApp, en persona): sin honeypot, correo opcional */
export const adminBookingSchema = bookingSchema.omit({ website: true }).extend({
  email: z.union([z.literal(''), email]).optional(),
  status: z.enum(['PENDING', 'CONFIRMED']).default('CONFIRMED'),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Elige de 1 a 5 estrellas').max(5),
  name: text(120),
  project: z.string().trim().max(120).default(''),
  service: z.enum(contactTopics, 'Elige un servicio'),
  text: text(reviewMaxLength),
  consent: z.boolean(),
  ...honeypot,
})

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mes inválido (YYYY-MM)')
