import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminApi, type MediaEntry, type MediaListing } from '../../lib/adminApi'
import './MediaPicker.css'

/** Qué se puede elegir: `file` es cualquier archivo (instaladores de plugins) */
export type MediaAccept = 'image' | 'video' | 'audio' | 'file'

const NOUN: Record<MediaAccept, { one: string; many: string }> = {
  image: { one: 'foto', many: 'fotos' },
  video: { one: 'video', many: 'videos' },
  audio: { one: 'audio', many: 'audios' },
  file: { one: 'archivo', many: 'archivos' },
}

interface MediaPickerProps {
  accept: MediaAccept
  /** Ruta actual del campo, para abrir en su carpeta */
  current: string
  onPick: (path: string) => void
  onClose: () => void
}

const folderOf = (path: string) => (path.startsWith('/media/') && path.includes('/', 7) ? path.slice(0, path.lastIndexOf('/')) : '/media')
const sizeText = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/**
 * Buscador de archivos del HDD de medios (para los campos F1 de Contenido): navegar por carpetas,
 * buscar por nombre y elegir con miniatura. Solo lee; elegir guarda la ruta /media/... en el campo.
 */
export function MediaPicker({ accept, current, onPick, onClose }: MediaPickerProps) {
  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [dir, setDir] = useState(() => folderOf(current))
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [data, setData] = useState<MediaListing | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    searchRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    let alive = true
    adminApi
      .mediaList(debounced ? { q: debounced } : { dir })
      .then((d) => alive && (setData(d), setError('')))
      .catch((err) => {
        if (!alive) return
        // Carpeta que ya no existe: volver a la raíz
        if (dir !== '/media' && !debounced) setDir('/media')
        else setError(err instanceof Error ? err.message : 'No se pudo leer la carpeta')
      })
    return () => {
      alive = false
    }
  }, [dir, debounced])

  const entries = (data?.entries ?? []).filter((e) => e.kind === 'dir' || e.kind === accept || accept === 'file')
  const crumbs = dir === '/media' ? ['/media'] : dir.split('/').slice(1).map((_, i, all) => '/' + all.slice(0, i + 1).join('/'))

  const open = (e: MediaEntry) => {
    if (e.kind === 'dir') {
      setQuery('')
      setDebounced('')
      setDir(e.path)
    } else onPick(e.path)
  }

  return createPortal(
    <div className="hf-mpick">
      <button type="button" className="hf-mpick__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <div className="hf-mpick__card" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="hf-mpick__head">
          <h2 id={`${id}-title`} className="hf-mpick__title">
            Elegir {NOUN[accept].one} <span>del HDD</span>
          </h2>
          <button type="button" className="hf-mpick__close" aria-label="Cerrar" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>

        <label className="hf-mpick__search" htmlFor={`${id}-q`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">Buscar por nombre</span>
          <input id={`${id}-q`} ref={searchRef} type="search" placeholder="Buscar por nombre en todo el HDD" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        {!debounced && (
          <nav className="hf-mpick__crumbs" aria-label="Carpeta">
            {crumbs.map((c, i) => (
              <span key={c}>
                {i > 0 && <span aria-hidden="true"> / </span>}
                <button type="button" aria-current={c === dir || undefined} onClick={() => setDir(c)}>
                  {i === 0 ? 'media' : decodeURIComponent(c.split('/').pop()!)}
                </button>
              </span>
            ))}
          </nav>
        )}
        {debounced && <p className="hf-mpick__muted">Resultados para “{debounced}”{data && ` · ${entries.length}`}</p>}

        {error && <p className="hf-admin__error" role="alert">{error}</p>}
        {data && !data.configured && (
          <p className="hf-mpick__muted">La carpeta de medios no está configurada: pon la ruta del HDD en MEDIA_DIR (.env) y reinicia la app.</p>
        )}

        <div className="hf-mpick__grid" aria-busy={data === null}>
          {!debounced && data?.parent && (
            <button type="button" className="hf-mpick__tile hf-mpick__tile--dir" onClick={() => setDir(data.parent!)}>
              <span className="hf-mpick__thumb" aria-hidden="true">↑</span>
              <span className="hf-mpick__name">Subir</span>
            </button>
          )}
          {entries.map((e) => (
            <button
              key={e.path}
              type="button"
              className={`hf-mpick__tile hf-mpick__tile--${e.kind} ${e.path === current ? 'is-current' : ''}`}
              title={e.path}
              onClick={() => open(e)}
            >
              <span className="hf-mpick__thumb">
                {e.kind === 'dir' ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></svg>
                ) : e.kind === 'image' ? (
                  <img src={e.path} alt="" loading="lazy" />
                ) : e.kind === 'video' ? (
                  <video src={e.path} muted preload="metadata" />
                ) : (
                  <span className="hf-mpick__ext" aria-hidden="true">{e.kind === 'audio' ? '♪' : ''}{e.name.split('.').pop()?.toUpperCase()}</span>
                )}
              </span>
              <span className="hf-mpick__name">{e.name}</span>
              {e.kind !== 'dir' && <span className="hf-mpick__size">{sizeText(e.size)}{debounced ? ` · ${folderOf(e.path).replace('/media', '') || '/'}` : ''}</span>}
            </button>
          ))}
          {data && data.configured && entries.length === 0 && (
            <p className="hf-mpick__muted hf-mpick__empty">{debounced ? 'Nada con ese nombre.' : `No hay ${NOUN[accept].many} ni carpetas aquí.`}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
