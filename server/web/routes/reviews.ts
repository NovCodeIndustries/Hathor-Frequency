import { Hono } from 'hono'
import { prisma } from '../../shared/db'
import { ReviewStatus } from '../../generated/prisma/enums'
import { parseBody } from '../../shared/lib/body'
import { reviewSchema } from '../../shared/schemas'
import { emitAdmin } from '../../shared/lib/siteEvents'

export const reviews = new Hono()

/** Nombre público cuando no autorizó publicarla con su nombre */
const ANONYMOUS = 'Anónimo'

/** Opiniones publicadas, más recientes primero (formato de `Review` en src/data/types.ts) */
reviews.get('/', async (c) => {
  const rows = await prisma.review.findMany({
    where: { status: ReviewStatus.PUBLISHED },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return c.json(
    rows.map((r) => ({
      id: r.id,
      name: r.consent ? r.name : ANONYMOUS,
      project: r.consent && r.project ? r.project : undefined,
      service: r.service,
      rating: r.rating,
      text: r.text,
    })),
  )
})

reviews.post('/', async (c) => {
  const body = await parseBody(c, reviewSchema)
  if (body instanceof Response) return body
  const { website, project, ...data } = body
  if (website) return c.json({ ok: true }, 201)

  await prisma.review.create({ data: { ...data, project: project || null } })
  emitAdmin('review')
  return c.json({ ok: true }, 201)
})
