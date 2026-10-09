import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { currentSeason, type Season } from '../../data/seasons'
import { ufoSchedule } from '../../data/site'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { PAGE_DURATION, PAGE_FLIGHT_IDS, planPageFlight, type PageFlightId } from './pageFlights'
import { SaucerCostume } from './seasonArt'
import { planSeasonFlight, SEASON_DURATION, SEASON_FLIGHT_IDS, type SeasonFlightId } from './seasonFlights'
import './Ufo.css'

/**
 * Platillo volador que explora todo el sitio (canvas https://claude.ai/artifact/GeKw8rC76CQZrMobAR9EKF).
 * Capa fija sobre la vista actual; en cada aparición hace una de sus acciones:
 *  - U2 · Escucha: baja al centro, abre un rayo, suben notas y se va de un tirón.
 *  - U3 · Zigzag: aparece como estrella, salta entre puntos y desaparece con un destello.
 *  - U4 · Scratch: baja junto a un vinilo de la página (Home, Artistas, FAQ) y le hace scratch.
 *  - U5 · Letra: se lleva una letra del titular dorado de la vista y luego la devuelve.
 *  - U6 · Onda: cruza el cielo dibujando una onda de sonido dorada.
 * Además interactúa con los componentes de cada página (P1–P6, en `pageFlights.tsx`): sube un fader
 * en Servicios, aparta un día en Reservar, se lleva un track en Artistas, escribe en el correo de
 * Contacto, suma un proyecto a la cifra del Home y se lleva una palabra del ticker.
 * Las acciones con objetivo solo salen si este está a la vista; si no, toca la siguiente.
 * Decorativo (`aria-hidden`); en móvil el platillo es más chico. No aparece con reduced-motion.
 */

type FlightId = 'escucha' | 'zigzag' | 'scratch' | 'letra' | 'onda' | PageFlightId | SeasonFlightId

const BASE_IDS: FlightId[] = ['escucha', 'zigzag', 'scratch', 'letra', 'onda']

/** En temporada, las acciones de página de la temporada reemplazan a las normales */
const flightIds = (season: Season | null): FlightId[] => [...BASE_IDS, ...(season ? SEASON_FLIGHT_IDS : PAGE_FLIGHT_IDS)]

const DURATION: Record<FlightId, number> = {
  escucha: 12_000,
  zigzag: 10_000,
  scratch: 12_000,
  letra: 13_000,
  onda: 11_000,
  ...PAGE_DURATION,
  ...SEASON_DURATION,
}

const isPageFlight = (id: FlightId): id is PageFlightId => (PAGE_FLIGHT_IDS as string[]).includes(id)
const isSeasonFlight = (id: FlightId): id is SeasonFlightId => (SEASON_FLIGHT_IDS as string[]).includes(id)

/** Debajo del nav fijo (más bajo en móvil) */
let TOP = 110
const MOBILE = 767
/** Centro del platillo respecto a su esquina (mide 160 × 90) */
const CX = 80
const CY = 48

/** Vinilos que giran en las páginas (todos con `transform-origin` en su centro) */
const VINYLS = ['.hf-hero__spin', '.hf-vinyl__spin', '.hf-faq__spin']

const NOTES = [
  { glyph: '♪', x: -150, y: 40, size: 30, tx: 140, delay: 0 },
  { glyph: '♫', x: 110, y: 10, size: 26, tx: -100, delay: 0.6 },
  { glyph: '♪', x: -60, y: 90, size: 34, tx: 50, delay: 1.2 },
  { glyph: '♬', x: 170, y: 70, size: 24, tx: -160, delay: 1.8 },
  { glyph: '♫', x: -200, y: 120, size: 22, tx: 190, delay: 2.4 },
]

const LIGHTS = [20, 40, 60, 80, 100, 120, 140]

interface Plan {
  id: FlightId
  run: number
  /** Temporada activa: disfraz, color del rayo y luces */
  season: Season | null
  /** Recorrido del platillo (Web Animations: posiciones en px de la ventana) */
  path: Keyframe[]
  /** Solo U6: trayectoria en onda (offset-path) */
  wave?: string
  /** Punto de referencia de los efectos (notas, ondas del scratch, destello) */
  fx: { x: number; y: number }
  /** Se ejecuta al empezar; devuelve la limpieza (objetivos de la página) */
  setup?: () => () => void
  /** Rayo genérico (acciones de página) */
  beam?: { w: number; h: number; kind: 'single' | 'double' }
  /** Elementos propios encima de la página (acciones de página) */
  overlay?: ReactNode
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const randomWait = () =>
  (ufoSchedule.minSeconds + Math.random() * (ufoSchedule.maxSeconds - ufoSchedule.minSeconds)) * 1000
const t = (x: number, y: number, extra = '') => `translate(${Math.round(x)}px, ${Math.round(y)}px) ${extra}`.trim()

/** Primer elemento de la lista que se ve completo en la ventana */
function visible(el: Element, minTop = TOP) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.top >= minTop && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth
}

/** Onda senoidal de lado a lado (curvas cúbicas que alternan arriba y abajo) */
function wavePath(w: number, y: number, amp: number) {
  const start = -200
  const segments = 4
  const len = (w + 400) / segments
  let d = `M ${start} ${y}`
  for (let k = 0; k < segments; k++) {
    const x0 = start + k * len
    const dy = k % 2 === 0 ? -amp : amp
    d += ` C ${Math.round(x0 + len / 3)} ${y + dy}, ${Math.round(x0 + (2 * len) / 3)} ${y + dy}, ${Math.round(x0 + len)} ${y}`
  }
  return d
}

function planFlight(id: FlightId, run: number, season: Season | null): Plan | null {
  const W = window.innerWidth
  const H = window.innerHeight
  const mobile = W <= MOBILE
  TOP = mobile ? 84 : 110
  // Margen mínimo para considerar "a la vista" un vinilo
  const edge = Math.min(200, W * 0.2)

  if (isPageFlight(id)) {
    const p = planPageFlight(id, { W, H, top: TOP })
    return p && { id, run, season, fx: { x: 0, y: 0 }, ...p }
  }

  if (isSeasonFlight(id)) {
    const p = season && planSeasonFlight(id, { W, H, top: TOP }, season)
    return p && { id, run, season, fx: { x: 0, y: 0 }, ...p }
  }

  if (id === 'escucha') {
    const x = W / 2 - CX
    const y = TOP + 20
    return {
      id,
      run,
      season,
      fx: { x: W / 2, y: y + 330 },
      path: [
        { offset: 0, transform: t(W * 0.82, -140, 'scale(.6)'), easing: 'cubic-bezier(.45,0,.55,1)' },
        { offset: 0.14, transform: t(x, y, 'scale(1)') },
        { offset: 0.52, transform: t(x, y + 10, 'scale(1)'), easing: 'ease-in' },
        { offset: 0.58, transform: t(x + 20, y, 'scale(1.05)'), easing: 'ease-in' },
        { offset: 0.64, transform: t(-0.18 * W, -180, 'scale(.3)') },
        { offset: 1, transform: t(-0.18 * W, -180, 'scale(.3)') },
      ],
    }
  }

  if (id === 'zigzag') {
    const jump = 'cubic-bezier(.9,0,.1,1)'
    const pts: [number, number][] = [
      [0.82 * W, TOP],
      [0.65 * W, TOP + 90],
      [0.77 * W, TOP + 180],
      [0.26 * W, TOP + 50],
      [0.12 * W, TOP + 190],
    ]
    const [ex, ey] = [0.14 * W, TOP + 176]
    return {
      id,
      run,
      season,
      fx: { x: ex + CX, y: ey + CY },
      path: [
        { offset: 0, transform: t(...pts[0], 'scale(.05)'), opacity: 0, easing: 'ease-out' },
        { offset: 0.04, transform: t(...pts[0], 'scale(1)'), opacity: 1, easing: 'steps(1)' },
        { offset: 0.12, transform: t(...pts[0], 'scale(1)'), easing: jump },
        { offset: 0.15, transform: t(...pts[1], 'scale(1)'), easing: 'steps(1)' },
        { offset: 0.21, transform: t(...pts[1], 'scale(1)'), easing: jump },
        { offset: 0.24, transform: t(...pts[2], 'scale(1)'), easing: 'steps(1)' },
        { offset: 0.29, transform: t(...pts[2], 'scale(1)'), easing: jump },
        { offset: 0.33, transform: t(...pts[3], 'scale(1)'), easing: 'steps(1)' },
        { offset: 0.38, transform: t(...pts[3], 'scale(1)'), easing: jump },
        { offset: 0.41, transform: t(...pts[4], 'scale(1)'), easing: 'ease-in-out' },
        { offset: 0.52, transform: t(ex, ey, 'scale(1)'), easing: 'ease-in' },
        { offset: 0.56, transform: t(ex, ey, 'scale(0)'), opacity: 1 },
        { offset: 0.57, transform: t(ex, ey, 'scale(0)'), opacity: 0 },
        { offset: 1, transform: t(ex, ey, 'scale(0)'), opacity: 0 },
      ],
    }
  }

  if (id === 'scratch') {
    const target = VINYLS.flatMap((s) => [...document.querySelectorAll<SVGGElement>(s)]).find((g) => {
      const svg = g.ownerSVGElement
      if (!svg) return false
      const r = svg.getBoundingClientRect()
      // Basta con que se vea buena parte del vinilo
      return r.width > 120 && r.bottom > TOP + edge && r.top < H - edge && r.right > edge && r.left < W - edge
    })
    if (!target) return null
    const r = target.ownerSVGElement!.getBoundingClientRect()
    const x = clamp(r.left + r.width * 0.7 - CX, -20, W - 140)
    const y = clamp(r.top + r.height * 0.15 - (mobile ? 100 : 140), TOP, H - 220)
    return {
      id,
      run,
      season,
      fx: { x: x + CX, y: y + 170 },
      path: [
        { offset: 0, transform: t(W + 60, y - 120, 'rotate(0deg)'), easing: 'cubic-bezier(.45,0,.55,1)' },
        { offset: 0.15, transform: t(x, y, 'rotate(-14deg)') },
        { offset: 0.48, transform: t(x, y + 6, 'rotate(-14deg)'), easing: 'ease-in' },
        { offset: 0.56, transform: t(W + 100, y - 200, 'rotate(8deg)') },
        { offset: 1, transform: t(W + 100, y - 200, 'rotate(8deg)') },
      ],
      // El vinilo va y viene; `rotate` se suma al giro que ya tiene en `transform`
      setup: () => {
        const anim = target.animate(
          [
            { offset: 0, rotate: '0deg' },
            { offset: 0.2, rotate: '0deg' },
            { offset: 0.23, rotate: '-28deg' },
            { offset: 0.26, rotate: '6deg' },
            { offset: 0.29, rotate: '-22deg' },
            { offset: 0.32, rotate: '10deg' },
            { offset: 0.35, rotate: '-30deg' },
            { offset: 0.38, rotate: '4deg' },
            { offset: 0.41, rotate: '-18deg' },
            { offset: 0.45, rotate: '0deg' },
            { offset: 1, rotate: '0deg' },
          ],
          { duration: DURATION.scratch },
        )
        return () => anim.cancel()
      },
    }
  }

  if (id === 'letra') {
    // Palabra dorada de un titular a la vista, en una sola línea y con espacio arriba para el platillo
    const word = [...document.querySelectorAll<HTMLElement>('h1 .hf-gold-text, h2 .hf-gold-text')].find(
      (el) => el.getClientRects().length === 1 && visible(el, TOP + (mobile ? 110 : 160)) && /\p{L}/u.test(el.textContent ?? ''),
    )
    if (!word) return null
    const text = word.textContent ?? ''
    const letters = [...text].map((ch, i) => ({ ch, i })).filter(({ ch }) => /\p{L}/u.test(ch))
    const pick = letters[Math.floor(letters.length / 2)]

    // Copia exacta de la palabra encima de la original; solo la copia se modifica
    const rect = word.getBoundingClientRect()
    const cs = getComputedStyle(word)
    const clone = document.createElement('span')
    clone.className = `${word.className} hf-ufo-word`
    Object.assign(clone.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      height: `${rect.height}px`,
      lineHeight: `${rect.height}px`,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
    })
    const letter = document.createElement('span')
    letter.className = 'hf-gold-text hf-ufo-letter'
    letter.textContent = pick.ch
    clone.append(text.slice(0, pick.i), letter, text.slice(pick.i + 1))

    // Medimos la letra en la copia para centrar el platillo encima
    document.body.append(clone)
    const lr = letter.getBoundingClientRect()
    const x = clamp(lr.left + lr.width / 2 - CX, -20, W - 140)
    const y = Math.max(TOP, lr.top - (mobile ? 170 : 250))
    const lift = lr.top - (y + 60)
    clone.remove()

    return {
      id,
      run,
      season,
      fx: { x: x + CX, y },
      path: [
        { offset: 0, transform: t(-220, y + 10), easing: 'cubic-bezier(.45,0,.55,1)' },
        { offset: 0.15, transform: t(x, y) },
        { offset: 0.6, transform: t(x, y + 4), easing: 'ease-in' },
        { offset: 0.7, transform: t(W + 200, y - 80) },
        { offset: 1, transform: t(W + 200, y - 80) },
      ],
      setup: () => {
        document.body.append(clone)
        const prev = word.style.visibility
        word.style.visibility = 'hidden'
        // Sube al rayo, desaparece, y luego cae y rebota en su lugar
        const anim = letter.animate(
          [
            { offset: 0, transform: 'translateY(0) rotate(0) scale(1)', opacity: 1 },
            { offset: 0.21, transform: 'translateY(0) rotate(0) scale(1)', opacity: 1, easing: 'ease-in' },
            { offset: 0.32, transform: `translateY(${-lift}px) rotate(200deg) scale(.3)`, opacity: 0 },
            { offset: 0.46, transform: `translateY(${-lift}px) rotate(380deg) scale(.3)`, opacity: 0, easing: 'ease-in' },
            { offset: 0.47, transform: `translateY(${-lift * 0.95}px) rotate(370deg) scale(.35)`, opacity: 1, easing: 'ease-in' },
            { offset: 0.54, transform: 'translateY(8px) rotate(360deg) scale(1)', opacity: 1, easing: 'ease-out' },
            { offset: 0.57, transform: 'translateY(-14px) rotate(360deg) scale(1)', opacity: 1 },
            { offset: 0.6, transform: 'translateY(0) rotate(360deg) scale(1)', opacity: 1 },
            { offset: 1, transform: 'translateY(0) rotate(360deg) scale(1)', opacity: 1 },
          ],
          { duration: DURATION.letra, fill: 'both' },
        )
        // Si la página se mueve, la copia ya no coincide: se devuelve la original
        const restore = () => {
          anim.cancel()
          clone.remove()
          word.style.visibility = prev
          window.removeEventListener('scroll', restore)
          window.removeEventListener('resize', restore)
        }
        window.addEventListener('scroll', restore, { passive: true })
        window.addEventListener('resize', restore)
        return restore
      },
    }
  }

  // onda
  const y = TOP + 60
  const wave = wavePath(W, y, mobile ? 40 : 70)
  return {
    id,
    run,
    season,
    wave,
    fx: { x: 0, y },
    path: [
      { offset: 0, offsetDistance: '0%' },
      { offset: 0.55, offsetDistance: '100%' },
      { offset: 1, offsetDistance: '100%' },
    ],
  }
}

function Saucer({ season }: { season: Season | null }) {
  return (
    <svg className="hf-ufo__saucer" viewBox="0 0 160 90" focusable="false">
      <path d="M50 42 C50 16 110 16 110 42Z" fill="rgba(242,201,76,0.12)" stroke="#F2C94C" strokeWidth="1.5" />
      {/* El extraterrestre G2 en la cabina */}
      <path d="M80 23 C88 23 92 29 91 35 C90 40 85 44 80 45 C75 44 70 40 69 35 C68 29 72 23 80 23Z" fill={season?.face === 'calavera' ? '#e9e4d8' : '#2a2d31'} stroke="#F2C94C" strokeWidth=".8" />
      <path d="M73 33 C75 30 79 31 79 35 C77 37 74 36 73 33Z M87 33 C85 30 81 31 81 35 C83 37 86 36 87 33Z" fill="#000" />
      <ellipse cx="80" cy="48" rx="76" ry="14" fill="#141414" stroke="#F2C94C" strokeWidth="1.5" />
      <ellipse cx="80" cy="57" rx="40" ry="8" fill="#0b0b0b" stroke="#B8860B" />
      {LIGHTS.map((cx, i) => (
        <circle
          key={cx}
          className="hf-ufo__light"
          cx={cx}
          cy={48 + Math.min(i, LIGHTS.length - 1 - i, 2) * 2}
          r="2.6"
          fill={cx === 80 ? '#fff3c4' : (season?.light ?? '#F2C94C')}
          style={{ animationDelay: `${-(i % 3) * 0.3}s` }}
        />
      ))}
      {season && <SaucerCostume id={season.id} />}
    </svg>
  )
}

export function Ufo() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const enabled = !reducedMotion

  const [plan, setPlan] = useState<Plan | null>(null)
  const pathRef = useRef<HTMLDivElement>(null)
  const flying = useRef(false)
  const queue = useRef<FlightId[]>([])
  const queueSeason = useRef<string | null>(null)
  const runs = useRef(0)

  // Orden de acciones: se baraja cada ronda; U4/U5 se saltan si su objetivo no está a la vista
  useEffect(() => {
    if (!enabled) return
    let wait = 0
    let land = 0

    const nextPlan = (): Plan | null => {
      // La temporada se revisa en cada vuelo: si cambió el mes, la ronda se rehace
      const season = currentSeason()
      const ids = flightIds(season)
      if (queueSeason.current !== (season?.id ?? null)) {
        queue.current = []
        queueSeason.current = season?.id ?? null
      }
      for (let tries = 0; tries < ids.length * 2; tries++) {
        if (queue.current.length === 0) queue.current = [...ids].sort(() => Math.random() - 0.5)
        const id = queue.current.shift()!
        const p = planFlight(id, ++runs.current, season)
        if (p) return p
      }
      return null
    }

    const launch = () => {
      const p = nextPlan()
      if (!p) return schedule(randomWait())
      flying.current = true
      setPlan(p)
      land = window.setTimeout(() => {
        flying.current = false
        setPlan(null)
        schedule(randomWait())
      }, DURATION[p.id])
    }

    const schedule = (delay: number) => {
      window.clearTimeout(wait)
      if (document.visibilityState !== 'visible') return
      wait = window.setTimeout(launch, delay)
    }

    // La espera se pausa con la pestaña oculta y vuelve a empezar al regresar
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') window.clearTimeout(wait)
      else if (!flying.current) schedule(randomWait())
    }

    schedule(new URLSearchParams(window.location.search).get('ovni') === '1' ? 1500 : randomWait())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(wait)
      window.clearTimeout(land)
      document.removeEventListener('visibilitychange', onVisibility)
      flying.current = false
      setPlan(null)
    }
  }, [enabled])

  // Arranca el recorrido y los efectos sobre la página; se limpia al aterrizar o desmontar
  useLayoutEffect(() => {
    if (!plan || !pathRef.current) return
    const anim = pathRef.current.animate(plan.path, { duration: DURATION[plan.id], fill: 'both' })
    const cleanup = plan.setup?.()
    return () => {
      anim.cancel()
      cleanup?.()
    }
  }, [plan])

  if (!enabled || !plan) return null

  const fx = {
    '--fx-x': `${plan.fx.x}px`,
    '--fx-y': `${plan.fx.y}px`,
    ...(plan.season ? { '--ufo-beam': plan.season.beam } : {}),
  } as CSSProperties

  return (
    <div key={plan.run} className={`hf-ufo hf-ufo--${plan.id}`} style={fx} aria-hidden="true">
      {plan.overlay && <div className="hf-ufo__overlay">{plan.overlay}</div>}

      {plan.id === 'onda' && plan.wave && (
        <svg className="hf-ufo__trail" width="100%" height="100%" focusable="false">
          <path className="hf-ufo__trail-line" pathLength={1000} d={plan.wave} />
          <path className="hf-ufo__trail-dots" d={plan.wave} />
        </svg>
      )}

      {plan.id === 'escucha' && (
        <div className="hf-ufo__fx">
          {NOTES.map((n) => (
            <span
              key={n.delay}
              className="hf-ufo__note"
              style={{ left: n.x, top: n.y, fontSize: n.size, '--tx': `${n.tx}px`, animationDelay: `${n.delay}s` } as CSSProperties}
            >
              {n.glyph}
            </span>
          ))}
        </div>
      )}

      {plan.id === 'scratch' && (
        <svg className="hf-ufo__fx hf-ufo__waves" width="300" height="200" viewBox="0 0 300 200" focusable="false">
          <path d="M120 100 A40 40 0 0 1 180 100" />
          <path d="M100 90 A60 60 0 0 1 200 90" />
          <path d="M80 80 A80 80 0 0 1 220 80" />
          <path d="M90 85 A70 70 0 0 1 210 85" />
        </svg>
      )}

      {plan.id === 'zigzag' && (
        <div className="hf-ufo__fx">
          <span className="hf-ufo__flash" />
          <span className="hf-ufo__ring" />
        </div>
      )}

      <div
        ref={pathRef}
        className="hf-ufo__path"
        style={plan.wave ? { offsetPath: `path('${plan.wave}')` } : undefined}
      >
        {(plan.id === 'escucha' || plan.id === 'scratch' || plan.id === 'letra') && <span className="hf-ufo__beam" />}
        {plan.beam && (
          <span
            className={`hf-ufo__beam hf-ufo__beam--${plan.beam.kind}`}
            style={{ left: CX - plan.beam.w / 2, width: plan.beam.w, height: plan.beam.h, animationDuration: `${DURATION[plan.id]}ms` }}
          />
        )}
        {plan.id === 'escucha' && <span className="hf-ufo__streak" />}
        <div className="hf-ufo__bob">
          <Saucer season={plan.season} />
        </div>
      </div>
    </div>
  )
}
