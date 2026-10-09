import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { MediaItem } from '../../data/types'
import './MediaPanel.css'

export type MediaKind = 'videos' | 'photos'

interface MediaPanelProps {
  artistName: string
  kind: MediaKind
  items: MediaItem[]
  index: number
  onIndex: (index: number) => void
  onClose: () => void
}

const ANGLES = ['135deg', '200deg', '60deg', '160deg', '20deg', '110deg']

/**
 * Galería del artista (diseño V6): panel a la izquierda del panel del artista,
 * con carrusel (pieza central grande, vecinas pequeñas) y tira de negativo para elegir.
 */
export function MediaPanel({ artistName, kind, items, index, onIndex, onClose }: MediaPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [playing, setPlaying] = useState<number | null>(null)
  const isVideo = kind === 'videos'
  const current = items[index]

  useEffect(() => {
    closeRef.current?.focus()
  }, [kind])

  const go = (i: number) => {
    setPlaying(null)
    onIndex((i + items.length) % items.length)
  }

  return (
    <div className="hf-media" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <svg className="hf-media__rings" viewBox="0 0 420 420" fill="none" aria-hidden="true" focusable="false">
        {[205, 180, 155, 130, 105, 80].map((r) => (
          <circle key={r} cx="210" cy="210" r={r} stroke="#F2C94C" />
        ))}
      </svg>

      <div className="hf-media__top">
        <div className="hf-media__heading">
          <span className="hf-media__kicker">{artistName}</span>
          <h2 id={titleId} className="hf-media__title">{isVideo ? 'Videos' : 'Fotos'}</h2>
        </div>
        <button ref={closeRef} type="button" className="hf-drawer__close" aria-label="Cerrar galería" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      {/* Carrusel */}
      <div className="hf-media__stage">
        {items.map((m, i) => {
          const off = i - index
          const state = off === 0 ? 'is-current' : Math.abs(off) === 1 ? 'is-near' : 'is-far'
          return (
            <div
              key={i}
              className={`hf-media__slide ${state}`}
              style={{ '--off': off, '--angle': ANGLES[i % ANGLES.length] } as CSSProperties}
              aria-hidden={off !== 0}
            >
              {isVideo ? (
                m.embed && playing === i ? (
                  <iframe
                    src={`${m.embed}${m.embed.includes('?') ? '&' : '?'}autoplay=1`}
                    title={m.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : m.embed && off === 0 ? (
                  <PlayRings>
                    <button type="button" className="hf-media__play" aria-label={`Reproducir ${m.title}`} onClick={() => setPlaying(i)}>
                      <PlayIcon />
                    </button>
                  </PlayRings>
                ) : (
                  <PlayRings>
                    <span className="hf-media__play" aria-hidden="true">
                      <PlayIcon />
                    </span>
                  </PlayRings>
                )
              ) : m.src ? (
                <img src={m.src} alt={m.title} loading="lazy" />
              ) : null}
              {!(isVideo && playing === i) && !m.src && <span className="hf-media__ph">{m.title}</span>}
            </div>
          )
        })}
      </div>

      <div className="hf-media__controls">
        <button type="button" className="hf-media__arrow" aria-label="Anterior" onClick={() => go(index - 1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 5h2v14H6zM20 5v14L9 12z" />
          </svg>
        </button>
        <p className="hf-media__caption" aria-live="polite">
          <span>{current.title}</span>
          <small>
            {current.detail} · {index + 1} / {items.length}
          </small>
        </p>
        <button type="button" className="hf-media__arrow" aria-label="Siguiente" onClick={() => go(index + 1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* Tira de negativo: detalle visual y selector */}
      <div className="hf-media__film">
        <span className="hf-media__holes" aria-hidden="true" />
        <div className="hf-media__frames" style={{ '--frames': Math.max(items.length, 6) } as CSSProperties}>
          {items.map((m, i) => (
            <button
              key={i}
              type="button"
              className="hf-media__frame"
              aria-label={m.title}
              aria-pressed={i === index}
              onClick={() => go(i)}
              style={{ '--angle': ANGLES[i % ANGLES.length] } as CSSProperties}
            >
              {m.src && !isVideo && <img src={m.src} alt="" loading="lazy" />}
              <span>{i + 1}A</span>
            </button>
          ))}
        </div>
        <span className="hf-media__holes" aria-hidden="true" />
      </div>
    </div>
  )
}

/** Botón de play P2: anillo dorado con dos ondas que salen de él */
function PlayRings({ children }: { children: ReactNode }) {
  return (
    <span className="hf-media__playwrap">
      <span className="hf-media__ripple" aria-hidden="true" />
      <span className="hf-media__ripple" aria-hidden="true" />
      {children}
    </span>
  )
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
