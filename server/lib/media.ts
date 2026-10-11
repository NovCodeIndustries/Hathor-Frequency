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
