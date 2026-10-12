import { Hono } from 'hono'
import { z } from 'zod'
import type { AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { cleanIds, publishedDisabled } from '../../shared/lib/site'
import { emitAdmin, emitSitePublished } from '../../shared/lib/siteEvents'
import { broadcastStats } from '../../shared/lib/stats'

/** /api/admin/site/*: borrador, publicar, descartar, historial y restaurar */
export const adminSite = new Hono<{ Variables: AdminVariables }>()

async function draftOrPublished() {
  const [draft, pub] = await Promise.all([prisma.siteDraft.findUnique({ where: { id: 1 } }), publishedDisabled()])
  return { draft: draft ? draft.disabled : pub.disabled, published: pub.disabled, versionId: pub.versionId, updatedAt: draft?.updatedAt ?? null }
}

adminSite.get('/', async (c) => c.json(await draftOrPublished()))

adminSite.put('/draft', async (c) => {
  const body = await parseBody(c, z.object({ disabled: z.array(z.string().max(120)).max(1000) }))
  if (body instanceof Response) return body
  const disabled = cleanIds(body.disabled)
  const updatedByName = c.get('admin').name
  await prisma.siteDraft.upsert({ where: { id: 1 }, create: { id: 1, disabled, updatedByName }, update: { disabled, updatedByName } })
  emitAdmin('site')
  return c.json(await draftOrPublished())
})

adminSite.post('/publish', async (c) => {
  const { draft, published } = await draftOrPublished()
  const same = draft.length === published.length && draft.every((id) => published.includes(id))
  if (same) return fail(c, 409, 'No hay cambios para publicar')
  await prisma.siteVersion.create({ data: { disabled: draft, publishedByName: c.get('admin').name } })
  // La web abierta cambia al instante
  emitSitePublished(draft)
  emitAdmin('site')
  void broadcastStats()
  return c.json(await draftOrPublished())
})

adminSite.post('/discard', async (c) => {
  await prisma.siteDraft.deleteMany({ where: { id: 1 } })
  return c.json(await draftOrPublished())
})

/** Últimas 30 publicaciones con qué cambió respecto a la anterior */
adminSite.get('/history', async (c) => {
  const rows = await prisma.siteVersion.findMany({ orderBy: { publishedAt: 'desc' }, take: 31 })
  return c.json(
    rows.slice(0, 30).map((v, i) => {
      const prev = rows[i + 1]?.disabled ?? []
      return {
        id: v.id,
        publishedAt: v.publishedAt,
        publishedByName: v.publishedByName,
        current: i === 0,
        hidden: v.disabled.filter((id) => !prev.includes(id)),
        shown: prev.filter((id) => !v.disabled.includes(id)),
      }
    }),
  )
})

/** Copia una versión al borrador (luego se publica) */
adminSite.post('/restore/:id', async (c) => {
  const v = await prisma.siteVersion.findUnique({ where: { id: c.req.param('id') } })
  if (!v) return fail(c, 404, 'Versión no encontrada')
  const disabled = cleanIds(v.disabled)
  const updatedByName = c.get('admin').name
  await prisma.siteDraft.upsert({ where: { id: 1 }, create: { id: 1, disabled, updatedByName }, update: { disabled, updatedByName } })
  return c.json(await draftOrPublished())
})
