/**
 * Datos de ejemplo para desarrollo: `npx prisma db seed`.
 * Las 3 opiniones son PROVISIONALES (antes vivían en src/data/reviews.ts); no usar en producción.
 */
import { prisma } from '../server/shared/db'
import { testimonial } from '../src/data/site'

const reviews = [
  { name: 'Sofía M.', project: 'R&B · Soul', service: 'Grabación', rating: 5, text: testimonial.quote.replace(/^“|”$/g, '') },
  { name: 'RALO', project: 'Hip-Hop · Trap', service: 'Mezcla', rating: 5, text: 'La mezcla respetó la energía de la toma; por fin el bajo pega donde tiene que pegar.' },
  { name: 'Luna K.', project: 'Pop · Indie', service: 'Live Sessions', rating: 4, text: 'Grabamos la live session en una tarde y el video quedó listo para subir esa misma semana.' },
]

for (const r of reviews) {
  const exists = await prisma.review.findFirst({ where: { name: r.name, text: r.text } })
  if (!exists) await prisma.review.create({ data: { ...r, consent: true, status: 'PUBLISHED' } })
}
console.info('✔ Seed listo')
await prisma.$disconnect()
