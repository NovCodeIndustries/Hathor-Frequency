import { Hono } from 'hono'
import { availabilityBetween } from '../lib/availability'
import { publishedContent } from '../lib/content'
import { monthRange } from '../lib/dates'
import { invalid } from '../lib/errors'
import { getMaintenance, publicMaintenance } from '../lib/maintenance'
import { publishedDisabled } from '../lib/site'
import { computeStats } from '../lib/stats'
import { monthSchema } from '../schemas'

/**
 * Lecturas públicas que montan la web y el panel (el panel las usa en Sitio, Contenido y la Agenda):
 * `/content`, `/site`, `/site/stats` y `/availability`. Solo lectura, sin datos personales.
 */
export function mountPublicReads(api: Hono) {
  /** GET /api/content: lo publicado de cada sección */
  api.get('/content', async (c) => {
    c.header('Cache-Control', 'no-cache')
    return c.json(await publishedContent())
  })

  /** GET /api/site: módulos apagados que ve el público y si la web está en mantenimiento */
  api.get('/site', async (c) => {
    c.header('Cache-Control', 'no-cache')
    const [site, maintenance] = await Promise.all([publishedDisabled(), getMaintenance()])
    return c.json({ ...site, maintenance: publicMaintenance(maintenance) })
  })

  /** GET /api/site/stats: cifras que salen de la base (proyectos terminados y artistas publicados) */
  api.get('/site/stats', async (c) => {
    c.header('Cache-Control', 'no-cache')
    return c.json(await computeStats())
  })

  /** GET /api/availability?month=YYYY-MM */
  api.get('/availability', async (c) => {
    const month = monthSchema.safeParse(c.req.query('month'))
    if (!month.success) return invalid(c, month.error)
    const { from, to } = monthRange(month.data)
    return c.json(await availabilityBetween(from, to))
  })
}
