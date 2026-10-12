import { useSyncExternalStore } from 'react'
import { contentDefaults, type ContentKey, type ContentMap } from '../data/content'
import type { Stat } from '../data/types'
import { onLive, onRefresh } from './live'
import { PANEL_ORIGIN } from './origins'

/**
 * Contenido de la web (panel · Contenido): lo publicado de cada sección o, si nunca se publicó,
 * el contenido inicial de `src/data`. En la vista previa del panel (`?modo=vista`, dentro del iframe del panel,
 * que vive en PANEL_ORIGIN) se muestra el borrador que manda el panel por postMessage.
 */

type Partial_ = { [K in ContentKey]?: ContentMap[K] }

let published: Partial_ = {}
let drafts: Partial_ = {}
let version = 0
const listeners = new Set<() => void>()
const emit = () => {
  version++
  listeners.forEach((l) => l())
}

export type PreviewMessage =
  | { type: 'hf-preview-ready' }
  | { type: 'hf-preview-draft'; key: ContentKey; data: unknown }

async function fetchPublished(timeout = 5000) {
  try {
    const res = await fetch('/api/content', { signal: AbortSignal.timeout(timeout), cache: 'no-store' })
    if (!res.ok) return
    published = (await res.json()) as Partial_
    emit()
  } catch {
    // sin red: se queda lo que hay (o el contenido inicial)
  }
}

const inFrame = () => {
  try {
    return window.parent !== window
  } catch {
    return false
  }
}

/** ¿Es la vista previa del panel · Contenido? */
export const isPreviewFrame = () => inFrame() && new URLSearchParams(window.location.search).get('modo') === 'vista'

function startPreview() {
  window.addEventListener('message', (e: MessageEvent<PreviewMessage>) => {
    if (e.origin !== PANEL_ORIGIN || e.source !== window.parent) return
    if (e.data?.type === 'hf-preview-draft') {
      drafts = { ...drafts, [e.data.key]: e.data.data }
      emit()
    }
  })
  // Con targetOrigin, el saludo solo llega si quien nos contiene es el panel
  window.parent.postMessage({ type: 'hf-preview-ready' } satisfies PreviewMessage, PANEL_ORIGIN)
}

// ── Cifras que salen de la base (Inicio y Estudio) ──

let dbStats: { projects: number; artists: number } | null = null

async function fetchStats(timeout = 5000) {
  try {
    const res = await fetch('/api/site/stats', { signal: AbortSignal.timeout(timeout), cache: 'no-store' })
    if (!res.ok) return
    dbStats = (await res.json()) as typeof dbStats
    emit()
  } catch {
    // sin red: se muestra el valor escrito
  }
}

/** Carga lo publicado (máx. 1.5 s) y escucha las publicaciones en vivo; nunca falla */
export async function loadContent(): Promise<void> {
  await Promise.all([fetchPublished(1500), fetchStats(1500)])
  onLive('stats', (data) => {
    dbStats = data as typeof dbStats
    emit()
  })
  onRefresh(() => void fetchStats())
  onLive('content', (data) => {
    const { key, data: value } = data as { key: ContentKey; data: unknown }
    published = { ...published, [key]: value }
    emit()
  })
  onRefresh(() => void fetchPublished())
  if (isPreviewFrame()) startPreview()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Contenido de una sección (borrador en la vista previa, publicado o inicial) */
export function getContent<K extends ContentKey>(key: K): ContentMap[K] {
  return (drafts[key] ?? published[key] ?? contentDefaults[key]) as ContentMap[K]
}

/** Igual que getContent, y se vuelve a pintar cuando se publica */
export function useContent<K extends ContentKey>(key: K): ContentMap[K] {
  useSyncExternalStore(subscribe, () => version)
  return getContent(key)
}

/** Nombre de un elemento de lista por su id de módulo (artistas.a14, paquetes.ep, faq.pago) para Sitio */
export function contentItemLabel(moduleId: string): string | undefined {
  const [kind, id] = moduleId.split('.')
  if (kind === 'artistas') return getContent('artistas').items.find((a) => a.code.toLowerCase() === id)?.name
  if (kind === 'paquetes') {
    const p = getContent('paquetes').items.find((x) => x.id === id)
    return p && `Paquete ${p.name}`
  }
  if (kind === 'faq') return getContent('faq').items.find((f) => f.id === id)?.q
  if (kind === 'servicios') return getContent('servicios').items.find((x) => x.id === id)?.name
  return undefined
}

/** Cifras de Datos del sitio con su valor real: las de la base se cuentan (proyectos terminados, artistas publicados) */
export function useStats(): Stat[] {
  const { stats } = useContent('sitio')
  return stats.map((s) =>
    s.source === 'proyectos' && dbStats
      ? { ...s, value: String(dbStats.projects) }
      : s.source === 'artistas' && dbStats
        ? { ...s, value: String(dbStats.artists) }
        : s,
  )
}
