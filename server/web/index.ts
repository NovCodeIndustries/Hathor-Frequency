import { createApi, startServer } from '../shared/http'
import { fail } from '../shared/lib/errors'
import { rateLimit } from '../shared/lib/rateLimit'
import { isPublishedOn } from '../shared/lib/site'
import { mountPublicReads } from '../shared/routes/read'
import { bookings } from './routes/bookings'
import { contact } from './routes/contact'
import { live } from './routes/live'
import { reviews } from './routes/reviews'

/**
 * API de la web pública (servicio `web`): formularios, lecturas públicas y avisos en vivo.
 * No monta nada del panel: `/api/admin/*` no existe aquí. Habla con el panel solo por PostgreSQL.
 */
const api = createApi('web')

// Formularios públicos: 10 envíos por IP cada 10 minutos
const publicPosts = rateLimit({ max: 10, windowMs: 10 * 60_000 })
for (const path of ['/contact', '/bookings', '/reviews']) api.post(path, publicPosts)

// Formularios de páginas apagadas en el panel · Sitio: no se aceptan envíos
const formModule: Record<string, string> = { '/contact': 'page.contacto', '/bookings': 'page.reservar', '/reviews': 'opiniones.dejar' }
for (const [path, id] of Object.entries(formModule)) {
  api.post(path, async (c, next) => {
    if (!(await isPublishedOn(id))) return fail(c, 403, 'Esta sección no está disponible por ahora')
    await next()
  })
}

mountPublicReads(api)
api.route('/site', live)
api.route('/contact', contact)
api.route('/bookings', bookings)
api.route('/reviews', reviews)

startServer('web', api, Number(process.env.WEB_API_PORT ?? 3000))
