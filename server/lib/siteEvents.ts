/**
 * Avisos en vivo del panel · Sitio: al publicar, cada visitante conectado a `GET /api/site/events`
 * recibe los módulos apagados y la web cambia al instante.
 * Vive en memoria de este proceso; con varias instancias habría que pasarlo a LISTEN/NOTIFY de PostgreSQL.
 */

type Listener = (disabled: string[]) => void
const listeners = new Set<Listener>()

export function onSitePublished(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function emitSitePublished(disabled: string[]) {
  for (const l of listeners) l(disabled)
}

export const siteListenerCount = () => listeners.size
