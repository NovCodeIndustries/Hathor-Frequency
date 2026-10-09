import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { artists, artistsIntro, sides } from '../../data/artists'
import type { Artist } from '../../data/types'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { ArtistDrawer } from './ArtistDrawer'
import { TrackRow } from './TrackRow'
import { Vinyl } from './Vinyl'
import './Artists.css'

const pad = (n: number) => String(n).padStart(2, '0')
const artistCount = artists.filter((a) => !a.cta).length

interface ScrollState {
  /** 0–1, avance de la lista */
  progress: number
  /** Índices (base 0) del primer y último artista visibles */
  first: number
  last: number
  atTop: boolean
  atEnd: boolean
}

export function Artists() {
  const [selected, setSelected] = useState<Artist | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState<ScrollState>({ progress: 0, first: 0, last: 0, atTop: true, atEnd: false })

  const rows = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>('.hf-track') ?? [])

  // Lee la posición de la lista: avance, artistas visibles y extremos
  const measure = useCallback(() => {
    const box = listRef.current
    if (!box) return
    const max = box.scrollHeight - box.clientHeight
    const top = box.scrollTop
    const visible = rows()
      .map((r, i) => ({ i, mid: r.offsetTop + r.offsetHeight / 2 }))
      .filter((r) => r.mid >= top && r.mid <= top + box.clientHeight)
    setScroll({
      progress: max > 0 ? top / max : 0,
      first: visible[0]?.i ?? 0,
      last: visible[visible.length - 1]?.i ?? 0,
      atTop: top <= 1,
      atEnd: max <= 0 || top >= max - 1,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // ▲ ▼: avanza de un artista en uno (al primero de cada lado se llega con su cabecera)
  const step = (dir: 1 | -1) => {
    const box = listRef.current
    if (!box) return
    const all = rows()
    const current = all.findIndex((r) => r.offsetTop >= box.scrollTop - 1)
    const target = all[Math.max(0, Math.min(all.length - 1, (current < 0 ? 0 : current) + dir))]
    if (!target) return
    const side = target.closest('.hf-side')
    const isFirst = side?.querySelector('.hf-track') === target
    const top = isFirst && side instanceof HTMLElement ? side.offsetTop : target.offsetTop
    box.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const select = (artist: Artist, button: HTMLButtonElement) => {
    trigger.current = button
    setSelected(artist)
  }

  const close = useCallback(() => {
    setSelected(null)
    trigger.current?.focus()
  }, [])

  return (
    <section id="artistas" className="hf-artists hf-container" aria-labelledby="artistas-title">
      <div className="hf-artists__left">
        <div className="hf-artists__title">
          <Eyebrow>Artistas</Eyebrow>
          <h1 id="artistas-title" className="hf-h2">
            Las voces <GoldText>del catálogo.</GoldText>
          </h1>
        </div>
        <div className="hf-artists__deck hf-artists__vinyl--desktop" style={{ '--progress': scroll.progress } as CSSProperties}>
          <Vinyl className="hf-artists__vinyl" progress={scroll.progress} />
          {/* Avance de la lista: arco dorado y brazo del tocadiscos */}
          <svg className="hf-artists__arc" viewBox="0 0 440 440" fill="none" aria-hidden="true" focusable="false">
            <circle cx="220" cy="220" r="214" stroke="#F2C94C" strokeWidth="3" strokeLinecap="round" pathLength={100} strokeDasharray={`${scroll.progress * 100} 100`} />
          </svg>
          <svg className="hf-artists__arm" viewBox="0 0 190 300" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="150" cy="40" r="22" fill="#111" stroke="#444" strokeWidth="1.5" />
            <path d="M150 40L120 230L82 268" />
            <rect x="66" y="258" width="30" height="16" rx="3" fill="#F2C94C" stroke="none" transform="rotate(42 81 266)" />
          </svg>
        </div>
        <Vinyl compact className="hf-artists__vinyl hf-artists__vinyl--mobile" />
      </div>

      <div className="hf-artists__right">
        <p className="hf-lead hf-artists__lead">{artistsIntro}</p>
        <div className="hf-artists__browser">
        <div
          ref={listRef}
          className={`hf-artists__list ${scroll.atTop ? '' : 'has-before'} ${scroll.atEnd ? '' : 'has-after'}`}
          onScroll={measure}
        >
        {(['A', 'B'] as const).map((side) => (
          <div key={side} className="hf-side">
            <h3 className="hf-side__head">
              <span>{sides[side].label}</span>
              <span className="hf-side__speed" aria-hidden="true">{sides[side].speed}</span>
            </h3>
            <ul>
              {artists
                .filter((a) => a.side === side)
                .map((a) => (
                  <TrackRow key={a.code} artist={a} onSelect={select} />
                ))}
            </ul>
          </div>
        ))}
        </div>

        {/* Controles de la lista (solo desktop/tablet) */}
        <div className="hf-artists__controls">
          <button type="button" className="hf-artists__step" aria-label="Artistas anteriores" disabled={scroll.atTop} onClick={() => step(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 6h14v2H5zM12 9l7 10H5z" />
            </svg>
          </button>
          <p className="hf-artists__count" aria-live="polite">
            <span>
              {pad(Math.min(scroll.first + 1, artistCount))}–{pad(Math.min(scroll.last + 1, artistCount))}
            </span>
            <span className="hf-artists__count-line" aria-hidden="true" />
            <span>de {pad(artistCount)}</span>
          </p>
          <button type="button" className="hf-artists__step" aria-label="Más artistas" disabled={scroll.atEnd} onClick={() => step(1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 16h14v2H5zM12 15L5 5h14z" />
            </svg>
          </button>
        </div>
        </div>
      </div>

      {selected && <ArtistDrawer artist={selected} onClose={close} />}
    </section>
  )
}
