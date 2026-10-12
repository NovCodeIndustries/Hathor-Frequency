import { useEffect, useRef } from 'react'
import { longPoll } from './longPoll'

/**
 * Avisos en vivo del panel (`GET /api/admin/events`, solo con sesión): cada reserva, contacto u opinión nueva,
 * o un cambio hecho en otra pestaña, avisa qué cambió y la barra lateral y la vista se recargan solas.
 * Sin SSE (p. ej. el túnel rápido de Cloudflare) los avisos llegan por long-polling (`/api/admin/events/poll`).
 */

export type AdminEventKind = 'booking' | 'contact' | 'review' | 'block' | 'site' | 'content' | 'users'
const ALL: AdminEventKind[] = ['booking', 'contact', 'review', 'block', 'site', 'content', 'users']

type Listener = (kind: AdminEventKind) => void
const listeners = new Set<Listener>()
let source: EventSource | null = null
let stopPoll: (() => void) | null = null

const emit = (kind: AdminEventKind) => listeners.forEach((l) => l(kind))

export function startAdminLive() {
  if (source || stopPoll || typeof window === 'undefined') return
  const startPolling = () => {
    stopPoll ??= longPoll<AdminEventKind>('/api/admin/events/poll', (kinds) => new Set(kinds).forEach(emit), () => ALL.forEach(emit))
  }
  if (typeof EventSource === 'undefined') return startPolling()
  source = new EventSource('/api/admin/events')
  const fallback = window.setTimeout(() => {
    source?.close()
    source = null
    // Lo que cambió mientras se esperaba al SSE no llegó por ningún lado
    ALL.forEach(emit)
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
  stopPoll?.()
  stopPoll = null
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
