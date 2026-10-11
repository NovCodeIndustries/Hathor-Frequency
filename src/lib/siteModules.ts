import { useSyncExternalStore } from 'react'
import { isModuleOn, linkModuleOf, moduleById, parentOf } from '../data/modules'
import { onLive, onRefresh } from './live'

/**
 * Módulos apagados del sitio (panel · Sitio). Se cargan antes de pintar la app (main.tsx)
 * para que lo oculto no aparezca un instante. Si la API falla, se usa la última copia guardada.
 *
 * Modo edición: la web dentro del iframe de /admin/sitio (`?modo=edicion`, solo con sesión de admin).
 * Ahí se muestra todo (lo apagado atenuado, diseño H2) y cada módulo lleva su switch; el borrador
 * lo manda el panel por postMessage y los cambios se piden al panel, que es quien los guarda.
 */

const CACHE_KEY = 'hf-site-disabled'

interface Snapshot {
  disabled: ReadonlySet<string>
  edit: boolean
  /** Vista previa del panel · Contenido (`?modo=vista`): sin marcos, sin bienvenida ni platillo */
  preview: boolean
}

let snap: Snapshot = { disabled: new Set(), edit: false, preview: false }
const listeners = new Set<() => void>()

function update(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch }
  listeners.forEach((l) => l())
}

function readCache(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

// ── Mensajes entre el iframe (modo edición) y el panel ──

export type EditMessage =
  | { type: 'hf-edit-ready'; path: string }
  | { type: 'hf-edit-route'; path: string }
  | { type: 'hf-edit-toggle'; id: string }
  | { type: 'hf-edit-draft'; disabled: string[] }

const inFrame = () => {
  try {
    return window.parent !== window
  } catch {
    return false
  }
}

/** Manda un mensaje al panel (solo en modo edición) */
export function postToPanel(msg: EditMessage) {
  if (snap.edit) window.parent.postMessage(msg, window.location.origin)
}

async function startEditMode() {
  const res = await fetch('/api/admin/me').catch(() => null)
  if (!res?.ok) return
  update({ edit: true })
  window.addEventListener('message', (e: MessageEvent<EditMessage>) => {
    if (e.origin !== window.location.origin || e.source !== window.parent) return
    if (e.data?.type === 'hf-edit-draft') update({ disabled: new Set(e.data.disabled) })
  })
  postToPanel({ type: 'hf-edit-ready', path: window.location.pathname + window.location.search })
}

function applyPublished(ids: string[]) {
  update({ disabled: new Set(ids) })
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ids))
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

/** Pide lo publicado a la API; sin red, se queda lo que hay */
async function fetchPublished(timeout = 5000): Promise<void> {
  try {
    const res = await fetch('/api/site', { signal: AbortSignal.timeout(timeout), cache: 'no-store' })
    if (!res.ok) return
    const { disabled: ids } = (await res.json()) as { disabled: string[] }
    applyPublished(ids)
  } catch {
    // sin red: se queda la copia
  }
}

/** Carga lo publicado (máx. 1.5 s) y, dentro del panel, el modo edición; nunca falla */
export async function loadSiteModules(): Promise<void> {
  update({ disabled: new Set(readCache()) })
  const mode = inFrame() ? new URLSearchParams(window.location.search).get('modo') : null
  if (mode === 'edicion') {
    await startEditMode()
    if (snap.edit) return
  }
  if (mode === 'vista') update({ preview: true })
  await fetchPublished(1500)
  // Al publicar en el panel, la web cambia al instante (src/lib/live.ts)
  onLive('site', (data) => applyPublished((data as { disabled: string[] }).disabled))
  onRefresh(() => void fetchPublished())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const useSnap = () => useSyncExternalStore(subscribe, () => snap)

/** En modo edición nunca se muestran (taparían la página o saltan solos) */
const EDIT_HIDDEN = new Set(['global.ufo', 'global.welcome', 'global.eggs'])
/** En modo edición siguen al borrador (no son un bloque que se pueda atenuar) */
const EDIT_LIVE = new Set(['global.seasons'])

function visible(id: string, s: Snapshot): boolean {
  if (s.preview && EDIT_HIDDEN.has(id)) return false
  if (!s.edit) return isModuleOn(id, s.disabled)
  if (EDIT_HIDDEN.has(id)) return false
  if (EDIT_LIVE.has(id)) return isModuleOn(id, s.disabled)
  return true
}

/** ¿Se pinta el módulo? (en modo edición casi todo se pinta, lo apagado atenuado) */
export function useModule(id: string): boolean {
  return visible(id, useSnap())
}

/** ¿Estamos en el modo edición del panel? */
export const useEditMode = () => useSnap().edit
export const isEditMode = () => snap.edit
/** Dentro de un iframe del panel (Sitio o Contenido): no se cuenta en Umami */
export const isPanelFrame = () => snap.edit || snap.preview

export interface EditState {
  /** El propio switch */
  selfOn: boolean
  /** Encendido de verdad (él y sus padres) */
  on: boolean
  /** Nombre del padre apagado que lo oculta, si es por eso */
  offBy?: string
  toggle: () => void
}

/** Estado de edición de un módulo; null fuera del modo edición */
export function useEditState(id: string): EditState | null {
  const s = useSnap()
  if (!s.edit) return null
  let offBy: string | undefined
  for (let p = parentOf(id); p; p = parentOf(p)) {
    if (s.disabled.has(p)) {
      offBy = moduleById.get(p)?.label
      break
    }
  }
  return {
    selfOn: !s.disabled.has(id),
    on: isModuleOn(id, s.disabled),
    offBy,
    toggle: () => postToPanel({ type: 'hf-edit-toggle', id }),
  }
}

/** Para filtrar listas: devuelve una función `isOn(id)` que se actualiza con los cambios */
export function useModuleFilter(): (id: string) => boolean {
  const s = useSnap()
  return (id: string) => visible(id, s)
}

/** Filtra una lista de links (`href`) quitando los de páginas apagadas */
export function useVisibleLinks<T extends { href: string }>(links: T[]): T[] {
  const s = useSnap()
  return links.filter((l) => {
    const id = linkModuleOf(l.href)
    return !id || visible(id, s)
  })
}

/** ¿Se debe mostrar un link interno? (oculto si su página o vista está apagada) */
export function useLinkVisible(to: string | undefined): boolean {
  const s = useSnap()
  const id = to ? linkModuleOf(to) : undefined
  return !id || visible(id, s)
}
