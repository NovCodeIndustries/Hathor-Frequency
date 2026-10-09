import { useCallback, useEffect, useRef, useState } from 'react'
import { rockAlienSchedule } from '../../data/booking'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { SeasonBadge } from '../Season/SeasonBadge'
import './RockAlienMini.css'

/**
 * Concierto del extraterrestre en pantallas angostas (< 1100px), diseño M1 · Escenario en línea
 * (canvas https://claude.ai/artifact/JMzbfjJigEjVAr5XLYy6X1): una tarjeta se abre debajo del calendario
 * con una escena chica (músico con cuernos y headbanging, público, luces y amplificador), toca unos
 * segundos y se cierra sola. Con ✕ se cierra y no vuelve a salir en esta visita.
 */

/** Cuánto se queda abierta la tarjeta */
const SHOW_MS = 14_000

const FANS = [
  { x: 14, y: 96, s: 0.65, o: 0.55 },
  { x: 40, y: 104, s: 0.85, o: 1 },
  { x: 74, y: 98, s: 0.7, o: 0.7 },
  { x: 100, y: 104, s: 0.85, o: 1 },
  { x: 132, y: 100, s: 0.7, o: 0.7 },
]

const SKIN = '#2a2d31'
const OUT = '#F2C94C'

function Limb({ d, w = 6 }: { d: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={OUT} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Escena de 340 × 170 en un solo SVG, para que escale con el ancho de la tarjeta */
function MiniScene() {
  return (
    <svg className="hf-ram__scene" viewBox="0 0 340 170" focusable="false">
      <defs>
        <linearGradient id="hf-ram-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2C94C" stopOpacity=".3" />
          <stop offset="1" stopColor="#F2C94C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="152" x2="340" y2="152" stroke="#F2C94C" strokeOpacity=".45" />
      <polygon className="hf-ram__beam" points="181,0 189,0 230,152 140,152" fill="url(#hf-ram-beam)" />
      <polygon className="hf-ram__beam hf-ram__beam--2" points="271,0 279,0 320,152 230,152" fill="url(#hf-ram-beam)" />

      {/* Público */}
      {FANS.map((f, i) => (
        <g key={f.x} transform={`translate(${f.x} ${f.y}) scale(${f.s})`} opacity={f.o}>
          <g className="hf-ram__fan" style={{ animationDelay: `${-(i * 0.11).toFixed(2)}s` }}>
            <Limb d="M12 30 L6 14 M28 30 L34 14" w={3} />
            <path d="M13 30 C11 40 13 50 15 56 L25 56 C27 50 29 40 27 30 C24 27 16 27 13 30Z" fill={SKIN} stroke={OUT} strokeWidth="1.2" />
            <path d="M20 2 C30 2 34 10 33 16 C32 22 26 28 20 28 C14 28 8 22 7 16 C6 10 10 2 20 2Z" fill={SKIN} stroke={OUT} strokeWidth="1.2" />
            <path d="M11 15 C13 11 18 12 18 17 C16 19 12 19 11 15Z M29 15 C27 11 22 12 22 17 C24 19 28 19 29 15Z" fill="#000" />
          </g>
        </g>
      ))}

      {/* Amplificador */}
      <g transform="translate(252 86)">
        <rect x="0" y="0" width="62" height="18" rx="2" fill="#0d0d0d" stroke="#B8860B" strokeWidth="1.5" />
        <text x="6" y="12.5" fontFamily="Cinzel, serif" fontStyle="italic" fontSize="8" fill="#F2C94C">Hathor</text>
        <rect x="0" y="18" width="62" height="46" rx="2" fill="#111" stroke="#B8860B" strokeWidth="1.5" />
        <circle className="hf-ram__ring" cx="31" cy="40" r="15" fill="none" stroke="#F2C94C" />
      </g>

      {/* Músico: cuernos con una mano, rasgueo con la otra y headbanging con peluca */}
      <svg x="172" y="52" width="60" height="100" viewBox="0 0 120 200" overflow="visible">
        <Limb d="M55 146 L53 170 L51 192 L43 194 M65 146 L67 170 L69 192 L77 194" />
        <path d="M47 104 C43 122 46 140 51 150 L69 150 C74 140 77 122 73 104 C66 99 54 99 47 104Z" fill={SKIN} stroke={OUT} strokeWidth="2" />
        <line x1="66" y1="142" x2="22" y2="110" stroke="#6b4a2b" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M60 134 C66 126 78 128 80 135 C87 132 93 138 89 145 C94 153 86 162 75 160 C65 163 55 157 57 149 C52 144 55 137 60 134Z" fill="#F2C94C" stroke="#111" strokeWidth="1.5" />
        <path d="M64 140 C70 136 78 138 80 144 C82 152 74 156 68 154 C62 152 60 146 64 140Z" fill="#111" />
        <g className="hf-ram__horns">
          <Limb d="M48 108 L38 82 L34 58" />
          <Limb d="M31 51 L27 37 M37 51 L41 37" w={3} />
          <circle cx="34" cy="54" r="5.5" fill={SKIN} stroke={OUT} strokeWidth="2" />
        </g>
        <g className="hf-ram__strum">
          <Limb d="M72 108 L82 128 L76 146" />
        </g>
        <g className="hf-ram__head">
          <path className="hf-ram__hair" d="M24 36 C26 4 94 4 96 36 C106 66 106 116 100 140 L88 132 C92 104 90 80 86 62 L34 62 C30 80 28 104 32 132 L20 140 C14 116 14 66 24 36Z" fill="#15110d" stroke="#B8860B" />
          <path d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" fill={SKIN} stroke={OUT} strokeWidth="2" />
          <path d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" fill="#000" stroke={OUT} strokeWidth="2" />
          <path d="M23 40 C23 6 97 6 97 40 C88 25 74 21 60 23 C46 21 32 25 23 40Z" fill="#15110d" stroke="#B8860B" />
        </g>
      </svg>
    </svg>
  )
}

export function RockAlienMini() {
  const narrow = useMediaQuery('(max-width: 1099px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const enabled = narrow && !reducedMotion

  const [run, setRun] = useState(0)
  const [open, setOpen] = useState(false)
  const showing = useRef(false)
  const dismissed = useRef(false)
  const hideTimer = useRef(0)
  // Lo asigna el efecto de horarios: programa la siguiente vez cuando la tarjeta termina de cerrarse
  const onClosedRef = useRef<() => void>(() => {})

  const close = useCallback(() => {
    window.clearTimeout(hideTimer.current)
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const interval = rockAlienSchedule.intervalSeconds * 1000
    let wait = 0

    const schedule = (delay: number) => {
      window.clearTimeout(wait)
      if (dismissed.current || document.visibilityState !== 'visible') return
      wait = window.setTimeout(show, delay)
    }

    const show = () => {
      showing.current = true
      setRun((r) => r + 1)
      setOpen(true)
      hideTimer.current = window.setTimeout(() => setOpen(false), SHOW_MS)
    }

    // Al cerrarse (sola o con ✕) espera el intervalo y vuelve a salir, salvo que la hayan cerrado con ✕
    onClosedRef.current = () => {
      showing.current = false
      schedule(interval)
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') window.clearTimeout(wait)
      else if (!showing.current) schedule(interval)
    }

    schedule(new URLSearchParams(window.location.search).get('alien') === '1' ? 0 : interval)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(wait)
      window.clearTimeout(hideTimer.current)
      document.removeEventListener('visibilitychange', onVisibility)
      showing.current = false
      setOpen(false)
    }
  }, [enabled])

  if (!enabled || run === 0) return null

  return (
    <div
      className={`hf-ram ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !open) onClosedRef.current()
      }}
    >
      <div className="hf-ram__inner">
        <div className="hf-ram__card">
          <div className="hf-ram__head-row">
            <span className="hf-ram__live">
              ● En vivo desde el estudio <SeasonBadge size={14} />
            </span>
            <button
              type="button"
              className="hf-ram__close"
              aria-label="Cerrar concierto"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                dismissed.current = true
                close()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
          <MiniScene key={run} />
          {open && <span key={run} className="hf-ram__bar" style={{ animationDuration: `${SHOW_MS}ms` }} />}
        </div>
      </div>
    </div>
  )
}
