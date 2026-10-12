import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import type { AdminVariables } from '../auth'
import { prisma } from '../db'
import { parseBody } from '../lib/body'
import { fail } from '../lib/errors'
import { cleanIds, publishedDisabled } from '../lib/site'
import { emitAdmin, emitSitePublished, onLiveEvent } from '../lib/siteEvents'
import { broadcastStats, computeStats } from '../lib/stats'

/** GET /api/site: módulos apagados que ve el público */
export const site = new Hono()

site.get('/', async (c) => {
  c.header('Cache-Control', 'no-cache')
  return c.json(await publishedDisabled())
})

/** GET /api/site/stats: cifras que salen de la base (proyectos terminados y artistas publicados) */
site.get('/stats', async (c) => {
  c.header('Cache-Control', 'no-cache')
  return c.json(await computeStats())
})

/** GET /api/site/events: SSE con un evento `site` cada vez que se publica (y un ping cada 25 s) */
site.get('/events', (c) => {
  // Que ningún proxy (nginx) acumule la respuesta
  c.header('X-Accel-Buffering', 'no')
  return streamSSE(c, async (stream) => {
    let closed = false
    const off = onLiveEvent((event, data) => {
      void stream.writeSSE({ event, data: JSON.stringify(data) })
    })
    stream.onAbort(() => {
      closed = true
      off()
    })
    // Relleno inicial (comentario SSE de 2 KB): algunos proxies retienen la respuesta hasta juntar unos KB
    await stream.write(`:${' '.repeat(2048)}\n\n`)
    await stream.writeSSE({ event: 'hello', data: '', retry: 5000 })
    while (!closed) {
      await stream.sleep(25_000)
      if (!closed) await stream.writeSSE({ event: 'ping', data: '' })
    }
  })
})

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
