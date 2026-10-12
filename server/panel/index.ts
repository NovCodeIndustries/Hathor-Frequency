import { secureHeaders } from 'hono/secure-headers'
import { createApi, startServer } from '../shared/http'
import { mountPublicReads } from '../shared/routes/read'
import { ensureRootAdmin } from './lib/rootAdmin'
import { admin } from './routes/admin'

/**
 * API del panel del estudio (servicio `panel`): sesión y `/api/admin/*`, más las lecturas públicas que usan
 * Sitio, Contenido y la Agenda. Corre aparte de la web: si se detiene, la web sigue funcionando.
 */
const api = createApi('panel')

// La API del panel no se indexa, no se mete en iframes y no da pistas del servidor
api.use(
  secureHeaders({
    contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    xFrameOptions: 'DENY',
    referrerPolicy: 'same-origin',
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? 'max-age=31536000; includeSubDomains' : false,
  }),
)
api.use(async (c, next) => {
  await next()
  c.header('X-Robots-Tag', 'noindex, nofollow')
})

mountPublicReads(api)
api.route('/admin', admin)

// El usuario principal del panel siempre existe
void ensureRootAdmin()

startServer('panel', api, Number(process.env.PANEL_API_PORT ?? 3001))
