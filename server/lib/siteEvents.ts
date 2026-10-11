/**
 * Avisos en vivo a la web abierta (`GET /api/site/events`, SSE):
 * `site` al publicar módulos (panel · Sitio) y `content` al publicar una sección (panel · Contenido).
 * Vive en memoria de este proceso; con varias instancias habría que pasarlo a LISTEN/NOTIFY de PostgreSQL.
 */

type Listener = (event: string, data: unknown) => void
const listeners = new Set<Listener>()

export function onLiveEvent(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function emitLive(event: 'site' | 'content', data: unknown) {
  for (const l of listeners) l(event, data)
}

export const emitSitePublished = (disabled: string[]) => emitLive('site', { disabled })
