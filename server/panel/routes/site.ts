import { Hono } from 'hono'
import { z } from 'zod'
import type { AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { cleanIds, publishedDisabled } from '../../shared/lib/site'
import { emitAdmin, emitLive, emitSitePublished } from '../../shared/lib/siteEvents'
import { getMaintenance, publicMaintenance } from '../../shared/lib/maintenance'
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

/** GET /api/admin/site/maintenance: estado del modo mantenimiento */
adminSite.get('/maintenance', async (c) => c.json(await getMaintenance()))

/**
 * PUT /api/admin/site/maintenance: apaga o enciende la web completa, al instante (sin borrador).
 * Al apagarla se guardan el mensaje y el regreso estimado; al encenderla se borran.
 */
adminSite.put('/maintenance', async (c) => {
  const body = await parseBody(
    c,
    z.object({
      enabled: z.boolean(),
      message: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
      until: z.iso.datetime({ offset: true }).nullable().optional(),
    }),
  )
  if (body instanceof Response) return body
  const updatedByName = c.get('admin').name
  const current = await getMaintenance()
  const data = body.enabled
    ? {
        enabled: true,
        message: body.message || null,
        until: body.until ? new Date(body.until) : null,
        // Si ya estaba apagada (solo cambia el mensaje), se conserva desde cuándo
        startedAt: current.enabled && current.startedAt ? new Date(current.startedAt) : new Date(),
        updatedByName,
      }
    : { enabled: false, message: null, until: null, startedAt: null, updatedByName }
  await prisma.siteMaintenance.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data })
  const state = await getMaintenance()
  // La web abierta cambia al instante (pantalla de mantenimiento o de vuelta al sitio)
  emitLive('maintenance', publicMaintenance(state))
  emitAdmin('site')
  return c.json(state)
})
