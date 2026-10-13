import { Hono } from 'hono'
import { z } from 'zod'
import type { Plugin } from '../../../src/data/types'
import { prisma } from '../../shared/db'
import { publishedOf } from '../../shared/lib/content'
import { fail } from '../../shared/lib/errors'
import { getMaintenance } from '../../shared/lib/maintenance'
import { rateLimit } from '../../shared/lib/rateLimit'
import { isPublishedOn } from '../../shared/lib/site'
import { emitAdmin } from '../../shared/lib/siteEvents'

/** /api/plugins/*: descargas de la página /plugins */
export const plugins = new Hono()

const target = z.enum(['mac', 'win', 'link'])

/**
 * GET /api/plugins/:id/download?os=mac|win|link: cuenta la descarga y redirige al instalador de la versión actual
 * (o al link de tienda/beta del plugin). Solo plugins publicados, encendidos y que no estén en "Próximamente".
 */
plugins.get('/:id/download', rateLimit({ max: 30, windowMs: 10 * 60_000 }), async (c) => {
  const id = c.req.param('id')
  const os = target.safeParse(c.req.query('os') ?? 'link')
  if (!/^[a-z0-9-]{1,40}$/.test(id) || !os.success) return fail(c, 404, 'Plugin no encontrado')
  if ((await getMaintenance()).enabled) return fail(c, 503, 'La web está en mantenimiento. Intenta más tarde.')
  if (!(await isPublishedOn(`plugins.${id}`))) return fail(c, 404, 'Plugin no encontrado')

  const { data } = await publishedOf('plugins')
  const plugin = (data as { items: Plugin[] }).items.find((p) => p.id === id)
  if (!plugin || plugin.status === 'soon') return fail(c, 404, 'Plugin no encontrado')

  let url: string | null = null
  let releaseId: string | null = null
  if (os.data === 'link') url = plugin.link || null
  else {
    const release = await prisma.pluginRelease.findFirst({ where: { pluginId: id, current: true } })
    url = (os.data === 'mac' ? release?.macPath : release?.winPath) ?? null
    releaseId = release?.id ?? null
  }
  // Solo rutas del HDD de medios o https (lo valida el panel al guardarlas; aquí se vuelve a revisar)
  if (!url || !(url.startsWith('/media/') || url.startsWith('https://'))) return fail(c, 404, 'No hay descarga disponible')

  await prisma.pluginDownload.create({ data: { pluginId: id, releaseId, target: os.data } })
  emitAdmin('plugins')
  return c.redirect(url, 302)
})
