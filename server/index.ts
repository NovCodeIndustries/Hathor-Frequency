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

const app = new Hono().basePath('/api')

app.use(logger())
app.use(jsonOnly)

// Formularios públicos: 10 envíos por IP cada 10 minutos
const publicPosts = rateLimit({ max: 10, windowMs: 10 * 60_000 })
for (const path of ['/contact', '/bookings', '/reviews']) app.post(path, publicPosts)

app.get('/health', (c) => c.json({ ok: true }))
app.route('/contact', contact)
app.route('/bookings', bookings)
app.route('/availability', availability)
app.route('/reviews', reviews)
app.route('/admin', admin)

app.notFound((c) => fail(c, 404, 'No encontrado'))
app.onError((err, c) => {
  console.error(err)
  return fail(c, 500, 'Error del servidor')
})

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.info(`API en http://localhost:${port}/api`))
