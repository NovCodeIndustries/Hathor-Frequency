import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { rockAlienSchedule } from '../../data/booking'
import { useMediaQuery } from '../../lib/useMediaQuery'
import './RockAlien.css'

/**
 * Easter egg de Reservar (diseño G2 · Contorno dorado, canvas https://claude.ai/artifact/1JGW3LSBYg1RTnKuqMzJUu).
 * Escenario debajo del calendario que llega hasta el borde izquierdo de la pantalla:
 * sube el amplificador, el extraterrestre se asoma, camina al centro, sale corriendo, busca cosas
 * (salen volando), vuelve con guitarra y peluca, toca, hace los cuernos y headbanging, y se va.
 * Decorativo (`aria-hidden`); no aparece en pantallas angostas ni con reduced-motion.
 */

type Mode = 'idle' | 'peek' | 'walk' | 'look' | 'run' | 'play' | 'rock'

interface Phase {
  ms: number
  /** Posición del extraterrestre: 'off' fuera a la izquierda, 'edge' asomándose, 'stage' junto al amplificador */
  at: 'off' | 'edge' | 'stage'
  /** Duración del desplazamiento hasta `at` */
  move?: number
  ease?: string
  mode: Mode
  lean?: number
  flip?: boolean
}

const PHASES: Phase[] = [
  { ms: 1300, at: 'off', mode: 'idle' }, // 0 · sube el amplificador
  { ms: 2000, at: 'edge', mode: 'peek', lean: 28 }, // 1 · se asoma
  { ms: 3000, at: 'stage', move: 3000, ease: 'linear', mode: 'walk' }, // 2 · camina al centro
  { ms: 1200, at: 'stage', mode: 'look' }, // 3 · ve el amplificador
  { ms: 1000, at: 'off', move: 1000, ease: 'ease-in', mode: 'run', lean: 10, flip: true }, // 4 · sale corriendo
  { ms: 2800, at: 'off', mode: 'idle' }, // 5 · busca algo: salen cosas volando
  { ms: 1100, at: 'stage', move: 1100, ease: 'ease-out', mode: 'run', lean: 10 }, // 6 · regresa con guitarra
  { ms: 3600, at: 'stage', mode: 'play' }, // 7 · toca
  { ms: 4600, at: 'stage', mode: 'rock' }, // 8 · cuernos y headbanging
  { ms: 2400, at: 'stage', mode: 'play' }, // 9 · sigue tocando
  { ms: 1600, at: 'off', move: 1300, ease: 'ease-in', mode: 'run', lean: 10, flip: true }, // 10 · se va; baja el amplificador
]

const SEARCH = 5
const WITH_GUITAR = 6
const LIVE = 7
const ROCK = 8
const EXIT = 10

/** Luces de escenario: posición respecto al centro, color del haz y ritmo del barrido */
const LIGHTS = [
  { dx: -300, color: 'rgba(242,201,76,0.16)', dur: 3.2, delay: 0 },
  { dx: -170, color: 'rgba(255,236,190,0.12)', dur: 2.6, delay: -0.8 },
  { dx: -40, color: 'rgba(184,134,11,0.2)', dur: 3.6, delay: -1.6 },
  { dx: 120, color: 'rgba(255,236,190,0.12)', dur: 2.8, delay: -0.4 },
  { dx: 250, color: 'rgba(242,201,76,0.16)', dur: 3.4, delay: -1.2 },
]

/** Cosas que salen volando: desplazamiento final respecto al centro del escenario */
const ITEMS = [
  { d: 'M6 34 L34 6', fill: 'none', stroke: '#d8c7a0', sw: 3, dx: -74, rot: 520, delay: 0 },
  { d: 'M20 34 C10 24 8 10 20 8 C32 10 30 24 20 34Z', fill: '#F2C94C', stroke: '#111', sw: 1, dx: -184, rot: 380, delay: 350 },
  { d: 'M4 22 C4 15 36 15 36 22 C36 29 4 29 4 22Z M18 20 L22 20', fill: '#B8860B', stroke: '#111', sw: 1, dx: 186, rot: 300, delay: 650 },
  { d: 'M14 4 L24 4 L24 22 C28 24 34 26 34 32 C34 36 28 36 22 34 L14 30Z', fill: '#bbb', stroke: '#111', sw: 1, dx: -14, rot: -400, delay: 950 },
  { d: 'M20 20 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0', fill: 'none', stroke: '#888', sw: 2.5, dx: -234, rot: 260, delay: 1250 },
  { d: 'M8 6 H32 V34 H8Z M12 13 H28 M12 19 H28 M12 25 H24', fill: '#eee', stroke: '#333', sw: 1.2, dx: 106, rot: -280, delay: 1550 },
]

// Silueta G2: gris muy oscuro con contorno dorado
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

function Hand({ cx, cy, r = 4.5 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={SKIN} stroke={OUT} strokeWidth="2" />
}

function Alien({ guitar, horns }: { guitar: boolean; horns: boolean }) {
  return (
    <svg className="hf-ra__alien" viewBox="0 0 120 200" focusable="false">
      <g className="hf-ra__bob">
        <g className="hf-ra__legL"><Limb d="M55 146 L53 170 L51 192 L43 194" /></g>
        <g className="hf-ra__legR"><Limb d="M65 146 L67 170 L69 192 L77 194" /></g>

        {!guitar && (
          <g className="hf-ra__armL">
            <Limb d="M48 108 L41 130 L39 148" />
            <Hand cx={39} cy={151} />
          </g>
        )}

        <path d="M47 104 C43 122 46 140 51 150 L69 150 C74 140 77 122 73 104 C66 99 54 99 47 104Z" fill={SKIN} stroke={OUT} strokeWidth="2" />
        <path d="M56 92 L56 104 L64 104 L64 92Z" fill={SKIN} />

        {guitar && (
          <>
            <g>
              <line x1="66" y1="142" x2="22" y2="110" stroke="#6b4a2b" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M24 111 L12 104 L14 99 L26 106Z" fill="#111" stroke={OUT} strokeWidth=".8" />
              <path d="M60 134 C66 126 78 128 80 135 C87 132 93 138 89 145 C94 153 86 162 75 160 C65 163 55 157 57 149 C52 144 55 137 60 134Z" fill="#F2C94C" stroke="#111" strokeWidth="1.5" />
              <path d="M64 140 C70 136 78 138 80 144 C82 152 74 156 68 154 C62 152 60 146 64 140Z" fill="#111" />
              <line x1="72" y1="150" x2="24" y2="112" stroke="#eee" strokeOpacity=".7" strokeWidth=".6" />
              <rect x="70" y="146" width="7" height="3" rx="1" fill="#ddd" />
            </g>
            {!horns && (
              <g>
                <Limb d="M48 108 L38 124 L30 118" />
                <Hand cx={29} cy={116} />
              </g>
            )}
            <g className="hf-ra__strum">
              <Limb d="M72 108 L82 128 L76 146" />
              <Hand cx={75} cy={148} />
            </g>
          </>
        )}

        {!guitar && (
          <g className="hf-ra__armR">
            <Limb d="M72 108 L79 130 L81 148" />
            <Hand cx={81} cy={151} />
          </g>
        )}

        <g className="hf-ra__head">
          {guitar && (
            <path
              className="hf-ra__hair"
              d="M24 36 C26 4 94 4 96 36 C106 66 106 116 100 140 L88 132 C92 104 90 80 86 62 L34 62 C30 80 28 104 32 132 L20 140 C14 116 14 66 24 36Z"
              fill="#15110d"
              stroke="#B8860B"
            />
          )}
          <path d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" fill={SKIN} stroke={OUT} strokeWidth="2" />
          <path d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z" fill="#000" stroke={OUT} strokeWidth="2" />
          <path d="M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" fill="#000" stroke={OUT} strokeWidth="2" />
          <circle cx="40" cy="46" r="2.3" fill="#fff" fillOpacity=".85" />
          <circle cx="80" cy="46" r="2.3" fill="#fff" fillOpacity=".85" />
          {guitar && <path d="M23 40 C23 6 97 6 97 40 C88 25 74 21 60 23 C46 21 32 25 23 40Z" fill="#15110d" stroke="#B8860B" />}
        </g>

        {horns && (
          <g className="hf-ra__horns">
            <Limb d="M48 108 L38 82 L34 58" />
            <path d="M31 51 L27 37 M37 51 L41 37" fill="none" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M31 51 L27 37 M37 51 L41 37" fill="none" stroke={SKIN} strokeWidth="3" strokeLinecap="round" />
            <Hand cx={34} cy={54} r={5.5} />
          </g>
        )}
      </g>
    </svg>
  )
}

export function RockAlien() {
  const wide = useMediaQuery('(min-width: 1100px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const enabled = wide && !reducedMotion

  const anchorRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const [phase, setPhase] = useState(-1)
  // Desde el borde de la pantalla hasta el calendario, y ancho de la columna
  const [box, setBox] = useState({ offset: 80, width: 700 })

  const clear = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }

  const running = useRef(false)

  const play = useCallback((onEnd: () => void) => {
    clear()
    running.current = true
    let at = 0
    PHASES.forEach((p, i) => {
      timers.current.push(window.setTimeout(() => setPhase(i), at))
      at += p.ms
    })
    timers.current.push(
      window.setTimeout(() => {
        setPhase(-1)
        running.current = false
        onEnd()
      }, at),
    )
  }, [])

  // Cada N segundos con la pestaña visible (la espera se pausa si se oculta y se reinicia al volver)
  useEffect(() => {
    if (!enabled) return
    const interval = rockAlienSchedule.intervalSeconds * 1000
    let wait = 0
    const schedule = (delay: number) => {
      window.clearTimeout(wait)
      if (document.visibilityState !== 'visible') return
      wait = window.setTimeout(() => play(() => schedule(interval)), delay)
    }
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') window.clearTimeout(wait)
      else if (!running.current) schedule(interval)
    }
    if (new URLSearchParams(window.location.search).get('alien') === '1') play(() => schedule(interval))
    else schedule(interval)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(wait)
      document.removeEventListener('visibilitychange', onVisibility)
      clear()
      running.current = false
      setPhase(-1)
    }
  }, [enabled, play])

  const active = enabled && phase >= 0

  // Mide la columna al arrancar para que el escenario llegue al borde izquierdo de la pantalla
  useLayoutEffect(() => {
    if (!active || phase !== 0 || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setBox({ offset: r.left, width: r.width })
  }, [active, phase])

  if (!enabled) return <div ref={anchorRef} aria-hidden="true" />
  if (!active) return <div ref={anchorRef} aria-hidden="true" />

  const p = PHASES[phase]
  const center = box.offset + box.width / 2
  const stageX = center - 134
  const x = p.at === 'stage' ? stageX : p.at === 'edge' ? -100 : -170
  const guitar = phase >= WITH_GUITAR
  const thrown = phase >= SEARCH
  const ampUp = phase < EXIT
  const live = phase >= LIVE && phase < EXIT

  return (
    <div ref={anchorRef} className="hf-ra" aria-hidden="true">
      <div className="hf-ra__stage" style={{ marginLeft: -box.offset, width: box.offset + box.width }}>
        <span className="hf-ra__floor" />

        {/* Rack de luces arriba: apagado al inicio, se enciende cuando empieza a tocar */}
        <span className="hf-ra__truss" style={{ left: center - 340, width: 680 }} />
        {LIGHTS.map((l) => (
          <span key={l.dx} className={`hf-ra__lamp ${live ? 'is-on' : ''}`} style={{ left: center + l.dx - 9 }} />
        ))}
        {live &&
          LIGHTS.map((l) => (
            <span
              key={l.dx}
              className={`hf-ra__beam ${phase === ROCK ? 'is-rock' : ''}`}
              style={
                {
                  left: center + l.dx - 90,
                  '--beam': l.color,
                  '--dur': `${l.dur}s`,
                  '--delay': `${l.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        {live && <span className="hf-ra__spot" style={{ left: center - 184 }} />}

        {/* Amplificador: sube desde el piso al empezar y baja al final */}
        <div className="hf-ra__ampwell" style={{ left: center + 36 }}>
          <div className={`hf-ra__amp ${ampUp ? 'is-up' : ''}`}>
            <div className="hf-ra__amp-head">
              <span className="hf-ra__amp-name">Hathor</span>
              <span className="hf-ra__amp-knobs">
                <span /><span /><span /><span />
              </span>
            </div>
            <div className="hf-ra__amp-cab">
              <span className="hf-ra__amp-badge">HF</span>
              {live && (
                <>
                  <span className="hf-ra__ring" />
                  <span className="hf-ra__ring" />
                </>
              )}
            </div>
          </div>
        </div>
        {phase === 0 && <span className="hf-ra__dust" style={{ left: center + 36 }} />}

        {ITEMS.map((it, i) => (
          <svg
            key={i}
            className={`hf-ra__item ${thrown ? 'is-thrown' : ''} ${phase === EXIT ? 'is-gone' : ''}`}
            viewBox="0 0 40 40"
            focusable="false"
            style={
              {
                left: thrown ? center + it.dx : -40,
                transform: `rotate(${thrown ? it.rot : 0}deg)`,
                '--delay': `${it.delay}ms`,
              } as CSSProperties
            }
          >
            <path d={it.d} fill={it.fill} stroke={it.stroke} strokeWidth={it.sw} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}

        <div
          className={`hf-ra__who is-${p.mode}`}
          style={{
            left: x,
            transform: p.flip ? 'scaleX(-1)' : undefined,
            transition: p.move ? `left ${p.move}ms ${p.ease ?? 'linear'}` : 'none',
          }}
        >
          <div className="hf-ra__lean" style={{ transform: `rotate(${p.lean ?? 0}deg)` }}>
            <Alien guitar={guitar} horns={p.mode === 'rock'} />
          </div>
        </div>
      </div>
    </div>
  )
}
