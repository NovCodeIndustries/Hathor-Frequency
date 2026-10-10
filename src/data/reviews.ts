import { testimonial } from './site'
import type { Review } from './types'

/**
 * Opiniones publicadas en /opiniones y en la rotación de Contacto.
 * TODO: solo opiniones reales y autorizadas. Hoy son PROVISIONALES (como el testimonio de Sofía M.):
 * reemplazar por las que se aprueben de la tabla `reviews` (docs/DESIGN.md §12).
 */
export const reviews: Review[] = [
  { name: 'Sofía M.', project: 'R&B · Soul', service: 'Grabación', rating: 5, text: testimonial.quote.replace(/^“|”$/g, '') },
  { name: 'RALO', project: 'Hip-Hop · Trap', service: 'Mezcla', rating: 5, text: 'La mezcla respetó la energía de la toma; por fin el bajo pega donde tiene que pegar.' },
  { name: 'Luna K.', project: 'Pop · Indie', service: 'Live Sessions', rating: 4, text: 'Grabamos la live session en una tarde y el video quedó listo para subir esa misma semana.' },
]

/** Texto de cada calificación (índice = estrellas; 0 = sin elegir) */
export const ratingLabels = ['Elige de 1 a 5 estrellas', 'Desafinado', 'Le falta mezcla', 'Suena bien', 'Suena muy bien', '¡Disco de oro!']

/** Cada cuánto cambia la opinión en Contacto */
export const reviewRotateMs = 6000

/** Máximo de caracteres de una opinión */
export const reviewMaxLength = 500
