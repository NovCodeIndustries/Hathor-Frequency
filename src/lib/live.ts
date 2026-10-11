/**
 * Canal en vivo de la web pública: `GET /api/site/events` (SSE). El servidor manda `site` al publicar
 * módulos (panel · Sitio) y `content` al publicar una sección (panel · Contenido).
 * Si SSE no responde en 6 s (p. ej. el túnel rápido de Cloudflare, que lo retiene), se consulta cada 15 s.
 */

type Handler = (data: unknown) => void

const handlers = new Map<string, Set<Handler>>()
const refreshers = new Set<() => void>()
let started = false

const POLL_MS = 15_000
const SSE_TIMEOUT_MS = 6_000

/** Escucha un evento del canal (`site`, `content`) */
export function onLive(event: string, handler: Handler) {
  if (!handlers.has(event)) handlers.set(event, new Set())
  handlers.get(event)!.add(handler)
}

/** Función para volver a pedir los datos: al reconectar, al volver a la pestaña y en el respaldo sin SSE */
export function onRefresh(fn: () => void) {
  refreshers.add(fn)
}

const refreshAll = () => refreshers.forEach((fn) => fn())

export function startLive() {
  if (started) return
  started = true
  let poll: number | undefined
  const startPolling = () => {
    poll ??= window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshAll()
    }, POLL_MS)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshAll()
  })

  if (typeof EventSource === 'undefined') return startPolling()
  const events = new EventSource('/api/site/events')
  const fallback = window.setTimeout(() => {
    events.close()
    startPolling()
  }, SSE_TIMEOUT_MS)

  for (const name of ['site', 'content']) {
    events.addEventListener(name, (e) => {
      let data: unknown
      try {
        data = JSON.parse((e as MessageEvent<string>).data)
      } catch {
        return refreshAll()
      }
      handlers.get(name)?.forEach((h) => h(data))
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
