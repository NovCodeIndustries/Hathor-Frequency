import { stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

/**
 * Medios (fotos y videos) en un disco aparte, montado en Docker y servido en `/media/...`.
 * La BD solo guarda la ruta o la URL. `MEDIA_DIR` es la carpeta montada (en Docker: /app/media).
 */
export const MEDIA_DIR = process.env.MEDIA_DIR ? resolve(process.env.MEDIA_DIR) : null

/** Archivo de `/media/...` dentro de MEDIA_DIR (null si sale de la carpeta o no hay carpeta) */
export function mediaFile(urlPath: string): string | null {
  if (!MEDIA_DIR || !urlPath.startsWith('/media/')) return null
  let rel: string
  try {
    rel = decodeURIComponent(urlPath.slice('/media/'.length))
  } catch {
    return null
  }
  const full = resolve(MEDIA_DIR, rel)
  return full.startsWith(MEDIA_DIR + sep) ? full : null
}

/** ¿Existe? true / false, o null si no hay carpeta de medios configurada */
export async function mediaExists(urlPath: string): Promise<boolean | null> {
  if (!MEDIA_DIR) return null
  const file = mediaFile(urlPath)
  if (!file) return false
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

// ── Buscador de archivos del panel ──

export type MediaKind = 'dir' | 'image' | 'video' | 'other'

export interface MediaEntry {
  name: string
  /** Ruta pública: /media/... */
  path: string
  kind: MediaKind
  size: number
  modifiedAt: string
}

const IMAGE = /\.(jpe?g|png|webp|gif|avif|svg)$/i
const VIDEO = /\.(mp4|webm|mov|m4v)$/i
const kindOf = (name: string, isDir: boolean): MediaKind => (isDir ? 'dir' : IMAGE.test(name) ? 'image' : VIDEO.test(name) ? 'video' : 'other')

/** Carpeta de `/media` o `/media/...` dentro de MEDIA_DIR (null si sale de la carpeta) */
function mediaDir(urlPath: string): string | null {
  if (!MEDIA_DIR) return null
  const clean = urlPath.replace(/\/+$/, '')
  if (clean === '/media' || clean === '') return MEDIA_DIR
  return mediaFile(clean)
}

const toUrl = (full: string) => '/media/' + full.slice(MEDIA_DIR!.length + 1).split(sep).map(encodeURIComponent).join('/')
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

async function entriesOf(full: string): Promise<MediaEntry[]> {
  const { readdir } = await import('node:fs/promises')
  const items = await readdir(full, { withFileTypes: true })
  const out: MediaEntry[] = []
  for (const it of items) {
    if (it.name.startsWith('.')) continue
    const p = resolve(full, it.name)
    try {
      const st = await stat(p)
      out.push({ name: it.name, path: toUrl(p), kind: kindOf(it.name, st.isDirectory()), size: st.size, modifiedAt: st.mtime.toISOString() })
    } catch {
      // archivo que desapareció o sin permiso: se omite
    }
  }
  return out.sort((a, b) => (a.kind === 'dir') === (b.kind === 'dir') ? a.name.localeCompare(b.name, 'es') : a.kind === 'dir' ? -1 : 1)
}

/** Contenido de una carpeta del HDD de medios */
export async function listMedia(urlPath: string): Promise<{ dir: string; parent: string | null; entries: MediaEntry[] } | null> {
  const full = mediaDir(urlPath)
  if (!full) return null
  const st = await stat(full).catch(() => null)
  if (!st?.isDirectory()) return null
  const dir = full === MEDIA_DIR ? '/media' : toUrl(full)
  const parent = full === MEDIA_DIR ? null : (() => {
    const up = resolve(full, '..')
    return up === MEDIA_DIR ? '/media' : toUrl(up)
  })()
  return { dir, parent, entries: await entriesOf(full) }
}

/** Busca por nombre en todo el HDD (máx. 200 resultados, 8 niveles de carpetas) */
export async function searchMedia(query: string): Promise<MediaEntry[]> {
  if (!MEDIA_DIR) return []
  const q = plain(query.trim())
  if (!q) return []
  const found: MediaEntry[] = []
  const walk = async (dir: string, depth: number) => {
    if (depth > 8 || found.length >= 200) return
    let list: MediaEntry[]
    try {
      list = await entriesOf(dir)
    } catch {
      return
    }
    for (const e of list) {
      if (found.length >= 200) return
      if (plain(e.name).includes(q)) found.push(e)
      if (e.kind === 'dir') await walk(resolve(dir, e.name), depth + 1)
    }
  }
  await walk(MEDIA_DIR, 0)
  return found
}
