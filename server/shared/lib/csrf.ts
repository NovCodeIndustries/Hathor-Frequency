import type { MiddlewareHandler } from 'hono'
import { fail } from './errors'

/**
 * Anti-CSRF para escrituras: solo JSON (un formulario de otro sitio no puede mandarlo sin preflight)
 * y, si el navegador manda Origin, que coincida con el Host.
 */
export const jsonOnly: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    if (!c.req.header('content-type')?.startsWith('application/json')) return fail(c, 415, 'Se esperaba JSON')
    const origin = c.req.header('origin')
    const host = c.req.header('x-forwarded-host') ?? c.req.header('host')
    if (origin && host && new URL(origin).host !== host) return fail(c, 403, 'Origen no permitido')
  }
  await next()
}
