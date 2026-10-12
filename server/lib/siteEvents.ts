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

export function emitLive(event: 'site' | 'content' | 'stats' | 'availability' | 'reviews', data: unknown) {
  for (const l of listeners) l(event, data)
}

export const emitSitePublished = (disabled: string[]) => emitLive('site', { disabled })

// ── Avisos del panel (solo admins con sesión: GET /api/admin/events) ──

/** Qué cambió: el panel recarga los contadores de la barra y la vista que lo muestre */
export type AdminEventKind = 'booking' | 'contact' | 'review' | 'block' | 'site' | 'content' | 'users'

type AdminListener = (kind: AdminEventKind) => void
const adminListeners = new Set<AdminListener>()

export function onAdminEvent(l: AdminListener): () => void {
  adminListeners.add(l)
  return () => adminListeners.delete(l)
}

export function emitAdmin(kind: AdminEventKind) {
  for (const l of adminListeners) l(kind)
}

/** Cambió la disponibilidad pública (reservas o bloqueos): el calendario de Reservar se vuelve a pedir */
export const emitAvailability = () => emitLive('availability', {})
