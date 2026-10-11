import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { jsonOnly } from './auth'
import { fail } from './lib/errors'
import { rateLimit } from './lib/rateLimit'
import { admin } from './routes/admin'
import { availability, bookings } from './routes/bookings'
import { contact } from './routes/contact'
import { reviews } from './routes/reviews'
import { site } from './routes/site'
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
app.route('/reviews', reviews)
app.route('/admin', admin)

app.notFound((c) => fail(c, 404, 'No encontrado'))
app.onError((err, c) => {
  console.error(err)
  return fail(c, 500, 'Error del servidor')
})

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.info(`API en http://localhost:${port}/api`))
