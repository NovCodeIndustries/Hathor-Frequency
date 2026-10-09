import type { CSSProperties, ReactNode } from 'react'

/**
 * Acciones del platillo con los componentes de cada página (P1–P6 del canvas
 * https://claude.ai/artifact/JMzbfjJigEjVAr5XLYy6X1). Todas son visuales y temporales:
 * no cambian estado de React ni datos, y devuelven todo a como estaba al terminar
 * o en cuanto la página se mueve (scroll / resize).
 */

export type PageFlightId = 'fader' | 'dia' | 'track' | 'correo' | 'cifras' | 'ticker'

export const PAGE_FLIGHT_IDS: PageFlightId[] = ['fader', 'dia', 'track', 'correo', 'cifras', 'ticker']

export const PAGE_DURATION: Record<PageFlightId, number> = {
  fader: 10_000,
  dia: 10_000,
  track: 11_000,
  correo: 11_000,
  cifras: 10_000,
  ticker: 10_000,
}

export interface PagePlan {
  path: Keyframe[]
  /** Rayo bajo el platillo: `single` una vez, `double` para llevarse algo y devolverlo */
  beam: { w: number; h: number; kind: 'single' | 'double' }
  /** Elementos propios del platillo encima de la página (en px de la ventana) */
  overlay?: ReactNode
  /** Aplica el efecto a la página; devuelve la restauración */
  setup: () => () => void
}

export interface Ctx {
  W: number
  H: number
  /** Debajo del nav */
  top: number
}

const CX = 80
export const tr = (x: number, y: number) => `translate(${Math.round(x)}px, ${Math.round(y)}px)`
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
export const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

export const inView = (r: DOMRect, ctx: Ctx, minTop: number) =>
  r.width > 0 && r.top >= minTop && r.bottom <= ctx.H && r.left >= 0 && r.right <= ctx.W

/** Llega de un lado, se queda encima del objetivo y se va por el otro */
export function hover(ctx: Ctx, x: number, y: number): Keyframe[] {
  const fromLeft = x > ctx.W / 2
  const a = fromLeft ? -220 : ctx.W + 60
  const b = fromLeft ? ctx.W + 60 : -220
  return [
    { offset: 0, transform: tr(a, y - 60), easing: 'cubic-bezier(.45,0,.55,1)' },
    { offset: 0.14, transform: tr(x, y) },
    { offset: 0.6, transform: tr(x, y + 4), easing: 'ease-in' },
    { offset: 0.7, transform: tr(b, y - 100) },
    { offset: 1, transform: tr(b, y - 100) },
  ]
}

/** Posición del platillo sobre un objetivo, y el alto del rayo hasta él */
export function above(ctx: Ctx, r: DOMRect, cx = r.left + r.width / 2, gap = 210) {
  const x = clamp(cx - CX, -20, ctx.W - 140)
  const y = Math.max(ctx.top, r.top - gap)
  return { x, y, beamH: Math.max(60, r.top - (y + 58)) }
}

/** Sube al rayo (y desaparece), espera y cae de regreso con un rebote: para el rayo `double` */
export function liftFrames(lift: number): Keyframe[] {
  const up = `translateY(${-lift}px) scale(.35)`
  return [
    { offset: 0, transform: 'none', opacity: 1 },
    { offset: 0.21, transform: 'none', opacity: 1, easing: 'ease-in' },
    { offset: 0.32, transform: up, opacity: 0 },
    { offset: 0.44, transform: up, opacity: 0, easing: 'ease-in' },
    { offset: 0.46, transform: `translateY(${-lift * 0.95}px) scale(.4)`, opacity: 1, easing: 'ease-in' },
    { offset: 0.54, transform: 'translateY(6px) scale(1)', opacity: 1, easing: 'ease-out' },
    { offset: 0.57, transform: 'none', opacity: 1 },
    { offset: 1, transform: 'none', opacity: 1 },
  ]
}

/** Si la página se mueve, los efectos ya no coinciden: se restaura todo y se ocultan los elementos propios */
export function untilMoved(restore: () => void) {
  let done = false
  const run = () => {
    if (done) return
    done = true
    window.removeEventListener('scroll', run)
    window.removeEventListener('resize', run)
    document.querySelectorAll<HTMLElement>('.hf-ufo__overlay').forEach((el) => (el.style.visibility = 'hidden'))
    restore()
  }
  window.addEventListener('scroll', run, { passive: true })
  window.addEventListener('resize', run)
  return run
}

/** Copia las medidas de tipografía de un elemento para que la copia se vea igual */
export function fontOf(el: Element): CSSProperties {
  const cs = getComputedStyle(el)
  return {
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform as CSSProperties['textTransform'],
    color: cs.color,
    textShadow: cs.textShadow,
  }
}

export function planPageFlight(id: PageFlightId, ctx: Ctx): PagePlan | null {
  const duration = PAGE_DURATION[id]
  const dur = { animationDuration: `${duration}ms` }

  // ---------- P1 · Servicios: sube un fader a +10 y lo regresa con rebote ----------
  if (id === 'fader') {
    const caps = [...document.querySelectorAll<HTMLElement>('.hf-strip__cap')]
    const cap = caps[1] ?? caps[0]
    const fader = cap?.parentElement
    if (!cap || !fader || !inView(fader.getBoundingClientRect(), ctx, ctx.top + 140)) return null
    const cr = cap.getBoundingClientRect()
    const fr = fader.getBoundingClientRect()
    const vertical = fr.height > fr.width
    // Vertical (desktop): hasta arriba; horizontal (móvil): hasta la derecha
    const dx = vertical ? 0 : fr.right - cr.width - cr.left
    const dy = vertical ? fr.top - cr.top : 0
    const { x, y, beamH } = above(ctx, vertical ? fr : cr, cr.left + cr.width / 2 + dx)
    const moved = `translate(${dx}px, ${dy}px)`
    const led = cap.closest('.hf-strip')?.querySelector<HTMLElement>('.hf-strip__led')
    return {
      path: hover(ctx, x, y),
      beam: { w: 80, h: beamH, kind: 'single' },
      setup: () => {
        const anims = [
          cap.animate(
            [
              { offset: 0, transform: 'none', boxShadow: '0 0 14px rgba(242,201,76,0.45)' },
              { offset: 0.22, transform: 'none', boxShadow: '0 0 14px rgba(242,201,76,0.45)', easing: 'ease-out' },
              { offset: 0.3, transform: moved, boxShadow: '0 0 26px rgba(242,201,76,0.95)' },
              // Regresa como fader motorizado: pasa un poco y se asienta
              { offset: 0.46, transform: moved, boxShadow: '0 0 26px rgba(242,201,76,0.95)', easing: 'cubic-bezier(.3,1.4,.6,1)' },
              { offset: 0.54, transform: 'none', boxShadow: '0 0 14px rgba(242,201,76,0.45)' },
              { offset: 1, transform: 'none', boxShadow: '0 0 14px rgba(242,201,76,0.45)' },
            ],
            { duration },
          ),
        ]
        if (led) {
          anims.push(
            led.animate(
              [
                { offset: 0, opacity: 0.6 },
                { offset: 0.24, opacity: 0.6 },
                { offset: 0.3, opacity: 1, boxShadow: '0 0 18px #F2C94C' },
                { offset: 0.46, opacity: 1, boxShadow: '0 0 18px #F2C94C' },
                { offset: 0.52, opacity: 0.6 },
                { offset: 1, opacity: 0.6 },
              ],
              { duration },
            ),
          )
        }
        const restore = () => anims.forEach((a) => a.cancel())
        return untilMoved(restore)
      },
    }
  }

  // ---------- P2 · Reservar: ilumina un día libre con su sello y lo deja como estaba ----------
  if (id === 'dia') {
    const days = [...document.querySelectorAll<HTMLButtonElement>('.hf-cal__day:not(:disabled):not([aria-pressed="true"])')].filter((d) =>
      inView(d.getBoundingClientRect(), ctx, ctx.top + 150),
    )
    if (days.length === 0) return null
    const day = pick(days)
    const r = day.getBoundingClientRect()
    const { x, y, beamH } = above(ctx, r, undefined, 200)
    const on = { background: '#F2C94C', color: '#000', borderColor: '#F2C94C', boxShadow: '0 0 22px rgba(242,201,76,0.5)' }
    const cs = getComputedStyle(day)
    const off = { background: cs.backgroundColor, color: cs.color, borderColor: cs.borderColor, boxShadow: 'none' }
    return {
      path: hover(ctx, x, y),
      beam: { w: 70, h: beamH, kind: 'single' },
      overlay: (
        <>
          <svg className="hf-ufo__stamp" viewBox="0 0 160 90" style={{ left: r.right - 28, top: r.top + 4, ...dur }}>
            <path d="M50 42 C50 16 110 16 110 42Z" fill="#000" />
            <ellipse cx="80" cy="48" rx="76" ry="14" fill="#000" />
          </svg>
          <span className="hf-ufo__tip" style={{ left: r.left + r.width / 2, top: r.bottom + 8, ...dur }}>
            Apartado por Andrómeda
          </span>
        </>
      ),
      setup: () => {
        const anim = day.animate(
          [
            { offset: 0, ...off },
            { offset: 0.24, ...off },
            { offset: 0.28, ...on },
            { offset: 0.56, ...on },
            { offset: 0.62, ...off },
            { offset: 1, ...off },
          ],
          { duration },
        )
        return untilMoved(() => anim.cancel())
      },
    }
  }

  // ---------- P3 · Artistas: se lleva un track de la lista y lo devuelve ----------
  if (id === 'track') {
    const rows = [...document.querySelectorAll<HTMLElement>('.hf-track:not(.hf-track--cta)')].filter((el) =>
      inView(el.getBoundingClientRect(), ctx, ctx.top + 170),
    )
    const row = rows[1] ?? rows[0]
    if (!row) return null
    const r = row.getBoundingClientRect()
    const { x, y, beamH } = above(ctx, r, r.left + Math.min(r.width * 0.4, 280), 220)
    return {
      path: hover(ctx, x, y),
      beam: { w: 100, h: beamH, kind: 'double' },
      overlay: (
        <span className="hf-ufo__gap" style={{ left: r.left, top: r.top, width: r.width, height: r.height, ...dur }}>
          — Transmitiendo a otra galaxia —
        </span>
      ),
      setup: () => {
        const anim = row.animate(liftFrames(r.top - (y + 60)), { duration })
        return untilMoved(() => anim.cancel())
      },
    }
  }

  // ---------- P4 · Contacto: escribe su correo en el campo (solo visual) y lo borra ----------
  if (id === 'correo') return typingPlan(ctx, 'saludos@andromeda.fm')

  // ---------- P5 · Home: la cifra de proyectos rueda a +1 ("uno marciano") ----------
  if (id === 'cifras') {
    const dd = document.querySelector<HTMLElement>('.hf-hero__stat dd')
    const dt = dd?.parentElement?.querySelector<HTMLElement>('dt')
    const m = dd?.textContent?.match(/^(\d+)(.*)$/)
    if (!dd || !dt || !m) return null
    const r = dd.getBoundingClientRect()
    const lr = dt.getBoundingClientRect()
    if (!inView(r, ctx, ctx.top + 150) || !inView(lr, ctx, ctx.top)) return null
    const next = `${Number(m[1]) + 1}${m[2]}`
    const label = dt.textContent ?? ''
    const { x, y, beamH } = above(ctx, r, undefined, 200)
    const width = r.width + 40
    return {
      path: hover(ctx, x, y),
      beam: { w: 70, h: beamH, kind: 'single' },
      overlay: (
        <>
          <span className="hf-ufo__roll" style={{ left: r.left - 20, top: r.top, width, height: r.height, ...fontOf(dd) }}>
            <span className="hf-ufo__roll-col" style={{ ...dur, lineHeight: `${r.height}px` }}>
              <span>{dd.textContent}</span>
              <span className="hf-ufo__roll-next">{next}</span>
            </span>
          </span>
          <span className="hf-ufo__label" style={{ left: lr.left + lr.width / 2, top: lr.top, height: lr.height, lineHeight: `${lr.height}px`, ...fontOf(dt) }}>
            <span className="hf-ufo__label-a" style={dur}>{label}</span>
            <span className="hf-ufo__label-b" style={dur}>{label} · uno marciano</span>
          </span>
        </>
      ),
      setup: () => {
        const prev = [dd.style.visibility, dt.style.visibility]
        dd.style.visibility = 'hidden'
        dt.style.visibility = 'hidden'
        return untilMoved(() => {
          dd.style.visibility = prev[0]
          dt.style.visibility = prev[1]
        })
      },
    }
  }

  // ---------- P6 · Ticker: detiene la banda, se lleva una palabra y la regresa ----------
  const track = document.querySelector<HTMLElement>('.hf-ticker__track')
  const words = [...document.querySelectorAll<HTMLElement>('.hf-ticker__half > span:not(.hf-ticker__sep)')].filter((w) => {
    const r = w.getBoundingClientRect()
    return r.left > 40 && r.right < ctx.W - 40 && r.top >= ctx.top + 150 && r.bottom <= ctx.H
  })
  if (!track || words.length === 0) return null
  const word = words.find((w) => w.textContent === 'Mezcla') ?? pick(words)
  const r = word.getBoundingClientRect()
  const { x, y, beamH } = above(ctx, r, undefined, 200)
  return {
    path: hover(ctx, x, y),
    beam: { w: 70, h: beamH, kind: 'double' },
    setup: () => {
      const running = track.getAnimations()
      running.forEach((a) => a.pause())
      const anim = word.animate(liftFrames(r.top - (y + 60)), { duration })
      return untilMoved(() => {
        anim.cancel()
        running.forEach((a) => a.play())
      })
    },
  }
}

/** Escribe `text` letra por letra encima del campo de correo vacío (solo visual) y lo borra */
export function typingPlan(ctx: Ctx, text: string, color?: string): PagePlan | null {
  const duration = PAGE_DURATION.correo
  const dur = { animationDuration: `${duration}ms` }
  const input = document.querySelector<HTMLInputElement>('.hf-contact__input')
  if (!input || input.value || document.activeElement === input) return null
  const r = input.getBoundingClientRect()
  if (!inView(r, ctx, ctx.top + 150)) return null
  const cs = getComputedStyle(input)
  const { x, y, beamH } = above(ctx, r, r.left + Math.min(r.width / 2, 200))
  return {
    path: hover(ctx, x, y),
    beam: { w: 80, h: beamH, kind: 'single' },
    overlay: (
      <span
        className="hf-ufo__typing"
        style={{ left: r.left + parseFloat(cs.paddingLeft), top: r.top, height: r.height, fontFamily: cs.fontFamily, fontSize: cs.fontSize }}
      >
        <span className="hf-ufo__typed" style={{ ...dur, color }}>{text}</span>
        <span className="hf-ufo__caret" style={{ ...dur, background: color }} />
      </span>
    ),
    setup: () => {
      // Oculta el placeholder mientras escribe; si la persona toca el campo, se quita todo
      input.classList.add('hf-ufo-typing')
      const stop = untilMoved(() => {
        input.classList.remove('hf-ufo-typing')
        input.removeEventListener('focus', stop)
      })
      input.addEventListener('focus', stop)
      return stop
    },
  }
}
