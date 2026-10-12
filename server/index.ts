import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { jsonOnly } from './auth'
import { fail } from './lib/errors'
import { MEDIA_DIR } from './lib/media'
import { ensureRootAdmin } from './lib/rootAdmin'
import { rateLimit } from './lib/rateLimit'
import { admin } from './routes/admin'
import { availability, bookings } from './routes/bookings'
import { contact } from './routes/contact'
import { reviews } from './routes/reviews'
import { site } from './routes/site'
import { content } from './routes/content'
import { isPublishedOn } from './lib/site'

const app = new Hono().basePath('/api')

app.use(logger())
app.use(jsonOnly)

// Formularios públicos: 10 envíos por IP cada 10 minutos
const publicPosts = rateLimit({ max: 10, windowMs: 10 * 60_000 })
for (const path of ['/contact', '/bookings', '/reviews']) app.post(path, publicPosts)

// Formularios de páginas apagadas en el panel · Sitio: no se aceptan envíos
const formModule: Record<string, string> = { '/contact': 'page.contacto', '/bookings': 'page.reservar', '/reviews': 'opiniones.dejar' }
for (const [path, id] of Object.entries(formModule)) {
  app.post(path, async (c, next) => {
    if (!(await isPublishedOn(id))) return fail(c, 403, 'Esta sección no está disponible por ahora')
    await next()
  })
}

app.get('/health', (c) => c.json({ ok: true }))
app.route('/contact', contact)
app.route('/bookings', bookings)
app.route('/availability', availability)
app.route('/site', site)
app.route('/content', content)
app.route('/reviews', reviews)
app.route('/admin', admin)

app.notFound((c) => fail(c, 404, 'No encontrado'))
app.onError((err, c) => {
  console.error(err)
  return fail(c, 500, 'Error del servidor')
})

/** Fuera de /api: los medios del HDD montado, en /media/... (solo lectura) */
const root = new Hono()
if (MEDIA_DIR) {
  root.use('/media/*', serveStatic({ root: MEDIA_DIR, rewriteRequestPath: (p) => p.replace(/^\/media/, '') }))
}
root.route('/', app)

// El usuario principal del panel siempre existe
void ensureRootAdmin()

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: root.fetch, port }, () => console.info(`API en http://localhost:${port}/api`))
