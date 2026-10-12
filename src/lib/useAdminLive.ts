import { useEffect, useRef } from 'react'

/**
 * Avisos en vivo del panel (`GET /api/admin/events`, solo con sesión): cada reserva, contacto u opinión nueva,
 * o un cambio hecho en otra pestaña, avisa qué cambió y la barra lateral y la vista se recargan solas.
 * Sin SSE (p. ej. el túnel rápido de Cloudflare) se avisa "todo" cada 20 s.
 */

export type AdminEventKind = 'booking' | 'contact' | 'review' | 'block' | 'site' | 'content' | 'users'
const ALL: AdminEventKind[] = ['booking', 'contact', 'review', 'block', 'site', 'content', 'users']

type Listener = (kind: AdminEventKind) => void
const listeners = new Set<Listener>()
let source: EventSource | null = null
let poll: number | undefined

const emit = (kind: AdminEventKind) => listeners.forEach((l) => l(kind))

export function startAdminLive() {
  if (source || poll || typeof window === 'undefined') return
  const startPolling = () => {
    poll ??= window.setInterval(() => {
      if (document.visibilityState === 'visible') ALL.forEach(emit)
    }, 20_000)
  }
  if (typeof EventSource === 'undefined') return startPolling()
  source = new EventSource('/api/admin/events')
  const fallback = window.setTimeout(() => {
    source?.close()
    source = null
    startPolling()
  }, 6000)
  let first = true
  source.addEventListener('hello', () => {
    window.clearTimeout(fallback)
    // Al reconectar tras un corte, todo pudo cambiar
    if (!first) ALL.forEach(emit)
    first = false
  })
  source.addEventListener('admin', (e) => emit((e as MessageEvent<string>).data as AdminEventKind))
}

export function stopAdminLive() {
  source?.close()
  source = null
  window.clearInterval(poll)
  poll = undefined
}

/** Llama `onChange` cuando llega un aviso de alguno de esos tipos (o de cualquiera si `kinds` es "all") */
export function useAdminLive(kinds: AdminEventKind[] | 'all', onChange: () => void) {
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })
  const key = kinds === 'all' ? 'all' : kinds.join(',')
  useEffect(() => {
    const want = key === 'all' ? null : new Set(key.split(','))
    const l: Listener = (kind) => {
      if (!want || want.has(kind)) cb.current()
    }
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [key])
}
