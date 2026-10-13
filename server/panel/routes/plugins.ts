import { Hono } from 'hono'
import { z } from 'zod'
import { mediaPath } from '../../shared/content/schemas'
import { prisma } from '../../shared/db'
import type { PluginRelease } from '../../generated/prisma/client'
import { parseBody } from '../../shared/lib/body'
import { fail } from '../../shared/lib/errors'
import { currentReleases } from '../../shared/lib/plugins'
import { isUniqueViolation } from '../../shared/lib/prismaErrors'
import { emitAdmin, emitLive } from '../../shared/lib/siteEvents'
import type { AdminVariables } from '../auth'
import { pathViews } from '../lib/umami'

/**
 * /api/admin/plugins/*: versiones y descargas del panel · Plugins (diseño K3).
 * La ficha de cada plugin es el contenido `plugins` (borrador y publicar con /api/admin/content/plugins/*).
 */
export const adminPlugins = new Hono<{ Variables: AdminVariables }>()

const DAY = 86_400_000
const pluginId = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Id inválido')
/** Instalador: /media/… o https; vacío = sin instalador */
const installer = mediaPath.transform((v) => v || null)

const releaseSchema = z.object({
  version: z.string().trim().regex(/^[0-9A-Za-z][0-9A-Za-z. -]{0,29}$/, 'Versión: letras, números, puntos y guiones (máx. 30)'),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  macPath: installer,
  winPath: installer,
  current: z.boolean(),
})
const patchSchema = z.object({ notes: releaseSchema.shape.notes, macPath: installer, winPath: installer, current: z.literal(true) }).partial()

const toRelease = (r: PluginRelease & { _count?: { downloads: number } }) => ({
  id: r.id,
  pluginId: r.pluginId,
  version: r.version,
  notes: r.notes,
  macPath: r.macPath,
  winPath: r.winPath,
  current: r.current,
  createdAt: r.createdAt.toISOString(),
  createdByName: r.createdByName,
  downloads: r._count?.downloads ?? 0,
})

/** Cambió una versión: la web abierta vuelve a pedir las versiones y el panel se actualiza */
const changed = () => {
  emitLive('plugins', {})
  emitAdmin('plugins')
}

/** GET /api/admin/plugins/stats: descargas de 30 días (y las 30 anteriores), por plugin, visitas a /plugins y versión actual */
adminPlugins.get('/stats', async (c) => {
  const now = Date.now()
  const d30 = new Date(now - 30 * DAY)
  const d60 = new Date(now - 60 * DAY)
  const [last30, prev30, per30, perAll, visits, current] = await Promise.all([
    prisma.pluginDownload.count({ where: { createdAt: { gte: d30 } } }),
    prisma.pluginDownload.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.pluginDownload.groupBy({ by: ['pluginId'], where: { createdAt: { gte: d30 } }, _count: { _all: true } }),
    prisma.pluginDownload.groupBy({ by: ['pluginId'], _count: { _all: true } }),
    pathViews('/plugins', d30.getTime(), now),
    currentReleases(),
  ])
  const perPlugin: Record<string, { last30: number; total: number }> = {}
  for (const r of perAll) perPlugin[r.pluginId] = { last30: 0, total: r._count._all }
  for (const r of per30) perPlugin[r.pluginId] = { ...(perPlugin[r.pluginId] ?? { total: 0 }), last30: r._count._all }
  return c.json({ last30, prev30, perPlugin, visits, current })
})

/** GET /api/admin/plugins/:id/releases: versiones de un plugin, la más nueva primero */
adminPlugins.get('/:id/releases', async (c) => {
  const id = pluginId.safeParse(c.req.param('id'))
  if (!id.success) return fail(c, 404, 'Plugin no encontrado')
  const rows = await prisma.pluginRelease.findMany({
    where: { pluginId: id.data },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { downloads: true } } },
  })
  return c.json(rows.map(toRelease))
})

/** POST /api/admin/plugins/:id/releases: nueva versión; con `current` pasa a ser la que se descarga */
adminPlugins.post('/:id/releases', async (c) => {
  const id = pluginId.safeParse(c.req.param('id'))
  if (!id.success) return fail(c, 404, 'Plugin no encontrado')
  const body = await parseBody(c, releaseSchema)
  if (body instanceof Response) return body
  try {
    const created = await prisma.$transaction(async (tx) => {
      if (body.current) await tx.pluginRelease.updateMany({ where: { pluginId: id.data, current: true }, data: { current: false } })
      return tx.pluginRelease.create({ data: { ...body, pluginId: id.data, createdByName: c.get('admin').name } })
    })
    changed()
    return c.json(toRelease(created), 201)
  } catch (err) {
    if (isUniqueViolation(err)) return fail(c, 409, `Ya existe la versión ${body.version}`, { version: 'Ya existe' })
    throw err
  }
})

/** PATCH /api/admin/plugins/releases/:rid: notas, instaladores o marcarla como la actual */
adminPlugins.patch('/releases/:rid', async (c) => {
  const body = await parseBody(c, patchSchema)
  if (body instanceof Response) return body
  const rid = c.req.param('rid')
  const found = await prisma.pluginRelease.findUnique({ where: { id: rid } }).catch(() => null)
  if (!found) return fail(c, 404, 'Versión no encontrada')
  const updated = await prisma.$transaction(async (tx) => {
    if (body.current) await tx.pluginRelease.updateMany({ where: { pluginId: found.pluginId, current: true, NOT: { id: rid } }, data: { current: false } })
    return tx.pluginRelease.update({ where: { id: rid }, data: body, include: { _count: { select: { downloads: true } } } })
  })
  changed()
  return c.json(toRelease(updated))
})

/** DELETE /api/admin/plugins/releases/:rid: sus descargas se conservan (sin versión) */
adminPlugins.delete('/releases/:rid', async (c) => {
  const { count } = await prisma.pluginRelease.deleteMany({ where: { id: c.req.param('rid') } }).catch(() => ({ count: 0 }))
  if (!count) return fail(c, 404, 'Versión no encontrada')
  changed()
  return c.json({ ok: true })
})
