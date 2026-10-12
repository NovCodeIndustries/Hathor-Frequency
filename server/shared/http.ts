import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { jsonOnly } from './lib/csrf'
import { fail } from './lib/errors'
import { listenEvents } from './lib/siteEvents'
import { MEDIA_DIR } from './lib/media'

/** App de Hono bajo `/api` con lo común a la web y al panel: logs, anti-CSRF, salud y errores JSON */
export function createApi(service: 'web' | 'panel') {
  const api = new Hono()
  api.use(logger())
  api.use(jsonOnly)
  api.get('/health', (c) => c.json({ ok: true, service }))
  api.notFound((c) => fail(c, 404, 'No encontrado'))
  api.onError((err, c) => {
    console.error(err)
    return fail(c, 500, 'Error del servidor')
  })
  return api
}

/** Levanta el servicio: `/api/*` más los medios del HDD en `/media/...` (solo lectura) y los avisos de PostgreSQL */
export function startServer(service: 'web' | 'panel', api: Hono, port: number) {
  const root = new Hono()
  if (MEDIA_DIR) {
    root.use('/media/*', serveStatic({ root: MEDIA_DIR, rewriteRequestPath: (p) => p.replace(/^\/media/, '') }))
  }
  root.route('/api', api)
  root.notFound((c) => fail(c, 404, 'No encontrado'))
  void listenEvents(service)
  serve({ fetch: root.fetch, port }, () => console.info(`[${service}] API en http://localhost:${port}/api`))
}
