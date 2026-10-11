/**
 * Las opiniones publicadas vienen de la API (`GET /api/reviews`, solo status PUBLISHED; hook `useReviews`).
 * Se aprueban desde el panel de admin. Para dev, `npm run db:seed` carga 3 de ejemplo (PROVISIONALES).
 */

/** Texto de cada calificación (índice = estrellas; 0 = sin elegir) */
export const ratingLabels = ['Elige de 1 a 5 estrellas', 'Desafinado', 'Le falta mezcla', 'Suena bien', 'Suena muy bien', '¡Disco de oro!']

/** Cada cuánto cambia la opinión en Contacto */
export const reviewRotateMs = 6000

/** Máximo de caracteres de una opinión */
export const reviewMaxLength = 500
