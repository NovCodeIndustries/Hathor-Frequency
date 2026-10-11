import type { MiddlewareHandler } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'
import { fail } from './errors'

/** IP del cliente; detrás de un proxy (túnel, hosting) viene en X-Forwarded-For */
export function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || getConnInfo(c).remote.address || 'unknown'
}

/**
 * Límite en memoria por IP: `max` peticiones por ventana de `windowMs`.
 * Suficiente para un solo proceso; con varias instancias habría que moverlo a la BD o a Redis.
 */
export function rateLimit({ max, windowMs }: { max: number; windowMs: number }): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>()
  return async (c, next) => {
    const now = Date.now()
    const ip = clientIp(c)
    const entry = hits.get(ip)
    if (!entry || entry.reset <= now) {
      hits.set(ip, { count: 1, reset: now + windowMs })
      if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
    } else if (++entry.count > max) {
      c.header('Retry-After', String(Math.ceil((entry.reset - now) / 1000)))
      return fail(c, 429, 'Demasiadas solicitudes, intenta en unos minutos')
    }
    await next()
  }
}
