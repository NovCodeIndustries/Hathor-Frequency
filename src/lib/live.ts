/**
 * Canal en vivo de la web pública: `GET /api/site/events` (SSE). El servidor manda `site` al publicar
 * módulos (panel · Sitio) y `content` al publicar una sección (panel · Contenido).
 * Si SSE no responde en 6 s (p. ej. el túnel rápido de Cloudflare, que lo retiene), los mismos avisos llegan
 * por long-polling (`/api/site/events/poll`, `longPoll.ts`).
 */

import { longPoll } from './longPoll'

type Handler = (data: unknown) => void

const handlers = new Map<string, Set<Handler>>()
const refreshers = new Set<() => void>()
let started = false

const SSE_TIMEOUT_MS = 6_000

/** Escucha un evento del canal (`site`, `content`, `stats`, `availability`, `reviews`); devuelve cómo dejar de escuchar */
export function onLive(event: string, handler: Handler): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set())
  handlers.get(event)!.add(handler)
  return () => {
    handlers.get(event)?.delete(handler)
  }
}

/** Función para volver a pedir los datos: al reconectar, al volver a la pestaña o si se perdieron avisos */
export function onRefresh(fn: () => void): () => void {
  refreshers.add(fn)
  return () => {
    refreshers.delete(fn)
  }
}

const refreshAll = () => refreshers.forEach((fn) => fn())

export function startLive() {
  if (started) return
  started = true
  const dispatch = (name: string, data: unknown) => handlers.get(name)?.forEach((h) => h(data))
  const startPolling = () => {
    longPoll<{ event: string; data: unknown }>('/api/site/events/poll', (items) => items.forEach((i) => dispatch(i.event, i.data)), refreshAll)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshAll()
  })

  if (typeof EventSource === 'undefined') return startPolling()
  const events = new EventSource('/api/site/events')
  const fallback = window.setTimeout(() => {
    events.close()
    // Lo que cambió mientras se esperaba al SSE no llegó por ningún lado
    refreshAll()
    startPolling()
  }, SSE_TIMEOUT_MS)

  for (const name of ['site', 'content', 'stats', 'availability', 'reviews']) {
    events.addEventListener(name, (e) => {
      let data: unknown
      try {
        data = JSON.parse((e as MessageEvent<string>).data)
      } catch {
        return refreshAll()
      }
      dispatch(name, data)
    })
  }
  // "hello" llega en cada conexión, también al reconectar tras un corte
  let first = true
  events.addEventListener('hello', () => {
    window.clearTimeout(fallback)
    if (!first) refreshAll()
    first = false
  })
}
