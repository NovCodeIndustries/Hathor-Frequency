import type { CSSProperties } from 'react'
import type { Season } from '../../data/seasons'
import { above, fontOf, hover, inView, pick, typingPlan, untilMoved, type Ctx, type PagePlan } from './pageFlights'
import { Glyph } from './seasonArt'

/**
 * Las 6 acciones de temporada con la página (canvas https://claude.ai/artifact/G3ndhJatQyyn9ZNA7UpeBZ).
 * Mismo esquema que `pageFlights`: el platillo llega, abre el rayo y hace algo visual y temporal
 * con los datos de la temporada activa (`src/data/seasons.ts`); al terminar todo vuelve a su lugar.
 */

export type SeasonFlightId = 's-home' | 's-fader' | 's-track' | 's-dia' | 's-correo' | 's-ticker'

export const SEASON_FLIGHT_IDS: SeasonFlightId[] = ['s-home', 's-fader', 's-track', 's-dia', 's-correo', 's-ticker']

export const SEASON_DURATION: Record<SeasonFlightId, number> = {
  's-home': 10_000,
  's-fader': 10_000,
  's-track': 10_000,
  's-dia': 10_000,
  's-correo': 11_000,
  's-ticker': 10_000,
}

/** Partículas alrededor de un punto: posición, retraso y tamaño */
const SPREAD = [
  { dx: -90, dy: 30, d: 0, s: 1 },
  { dx: 70, dy: 10, d: 0.3, s: 0.8 },
  { dx: -30, dy: 70, d: 0.6, s: 1.1 },
  { dx: 100, dy: 80, d: 0.9, s: 0.9 },
  { dx: -120, dy: -20, d: 1.2, s: 0.7 },
  { dx: 30, dy: -40, d: 1.5, s: 1 },
]

export function planSeasonFlight(id: SeasonFlightId, ctx: Ctx, season: Season): PagePlan | null {
  const duration = SEASON_DURATION[id]
  const dur = { animationDuration: `${duration}ms` }
  const acc = season.acc

  // ---------- Home: etiqueta del vinilo, fuegos artificiales o camino de pétalos ----------
  if (id === 's-home') {
    const vinyl = document.querySelector<SVGSVGElement>('.hf-hero__vinyl')
    const title = document.getElementById('hero-title')
    if (!vinyl || !title) return null
    const vr = vinyl.getBoundingClientRect()
    const cx = vr.left + vr.width / 2
    const cy = vr.top + vr.height / 2
    const home = season.home

    if (home.kind === 'fireworks') {
      const tr = title.getBoundingClientRect()
      if (!inView(tr, ctx, ctx.top + 60)) return null
      const bursts = [
        { x: tr.left + tr.width * 0.15, y: tr.top - 10, c: home.colors[0], d: 0 },
        { x: tr.left + tr.width * 0.85, y: tr.top + 10, c: home.colors[2] ?? home.colors[0], d: 0.5 },
        { x: tr.left + tr.width * 0.5, y: tr.top - 40, c: home.colors[1] ?? home.colors[0], d: 1 },
      ]
      const { x, y } = above(ctx, tr, tr.left + tr.width * 0.3, 180)
      return {
        path: hover(ctx, x, y),
        beam: { w: 60, h: 40, kind: 'single' },
        overlay: (
          <>
            {bursts.map((b, i) => (
              <svg key={i} className="hf-ufo__burst" width="120" height="120" viewBox="0 0 120 120" style={{ left: b.x - 60, top: b.y - 60, ...dur, animationDelay: `${b.d}s` }}>
                {Array.from({ length: 10 }, (_, k) => {
                  const a = (k / 10) * Math.PI * 2
                  return <path key={k} d={`M60 60 L${60 + 52 * Math.cos(a)} ${60 + 52 * Math.sin(a)}`} stroke={b.c} strokeWidth="2.5" strokeLinecap="round" />
                })}
              </svg>
            ))}
            {home.confetti &&
              Array.from({ length: 10 }, (_, k) => (
                <span
                  key={k}
                  className="hf-ufo__fall"
                  style={{ left: tr.left + (tr.width * k) / 9, top: tr.top - 60, width: 6, height: 10, background: home.colors[k % home.colors.length], ...dur, animationDelay: `${(k % 4) * 0.2}s` }}
                />
              ))}
            <span className="hf-ufo__bubble" style={{ left: tr.left + tr.width / 2, top: Math.max(ctx.top, tr.top - 56), ...dur }}>
              {home.message}
            </span>
          </>
        ),
        setup: () => untilMoved(() => {}),
      }
    }

    if (cy < ctx.top + 80 || cy > ctx.H - 40) return null
    const labelR = (80 / 440) * vr.width
    const { x, y } = above(ctx, new DOMRect(cx - 40, cy - 20, 80, 40), cx, 260)

    if (home.kind === 'trail') {
      const sx = 0
      const sy = Math.min(ctx.H - 30, cy + labelR * 2.4)
      return {
        path: hover(ctx, x, y),
        beam: { w: 70, h: Math.max(60, cy - (y + 58)), kind: 'single' },
        overlay: (
          <>
            <svg className="hf-ufo__trailsvg" width={ctx.W} height={ctx.H} viewBox={`0 0 ${ctx.W} ${ctx.H}`} style={{ left: 0, top: 0 }}>
              <path
                className="hf-ufo__petals"
                d={`M${sx} ${sy} C ${cx * 0.4} ${sy - 40}, ${cx * 0.6} ${cy + labelR * 1.6}, ${cx} ${cy}`}
                pathLength={400}
                fill="none"
                stroke={acc}
                strokeWidth="7"
                strokeLinecap="round"
                style={dur}
              />
            </svg>
            <span className="hf-ufo__pop" style={{ left: cx - labelR * 0.8, top: cy - labelR * 0.8, ...dur }}>
              <Glyph name={home.glyph} size={labelR * 1.6} />
            </span>
          </>
        ),
        setup: () => untilMoved(() => {}),
      }
    }

    // label: algo sobre la etiqueta y partículas alrededor
    const motion = home.motion
    return {
      path: hover(ctx, x, y),
      beam: { w: 70, h: Math.max(60, cy - labelR - (y + 58)), kind: 'single' },
      overlay: (
        <>
          <span className="hf-ufo__pop" style={{ left: cx - labelR, top: cy - labelR, width: labelR * 2, height: labelR * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', ...dur }}>
            <span className="hf-ufo__pulse" style={{ display: 'flex' }}>
              <Glyph name={home.glyph} size={labelR * 1.5} />
            </span>
          </span>
          {SPREAD.map((p, i) => (
            <span
              key={i}
              className={`hf-ufo__${motion}`}
              style={{ left: cx + p.dx * (vr.width / 700), top: motion === 'fall' ? cy - labelR * 3 : cy + p.dy * (vr.width / 700), ...dur, animationDelay: `${p.d}s` }}
            >
              <Glyph name={home.particles} size={22 * p.s} color={home.colors?.[i % home.colors.length]} />
            </span>
          ))}
        </>
      ),
      setup: () => untilMoved(() => {}),
    }
  }

  // ---------- Servicios: caps de colores, movimiento y adornos sobre cada canal ----------
  if (id === 's-fader') {
    const caps = [...document.querySelectorAll<HTMLElement>('.hf-strip__cap')]
    const first = caps[0]?.parentElement
    if (caps.length === 0 || !first || !inView(first.getBoundingClientRect(), ctx, ctx.top + 140)) return null
    const strips = caps.map((c) => c.closest('.hf-strip')?.getBoundingClientRect() ?? c.getBoundingClientRect())
    const mid = strips[Math.floor(strips.length / 2)]
    const { x, y } = above(ctx, mid, undefined, 200)
    const { colors, motion, deco, lights } = season.faders
    const top = Math.min(...strips.map((r) => r.top))
    return {
      path: hover(ctx, x, y),
      beam: { w: 90, h: Math.max(60, top - (y + 58)), kind: 'single' },
      overlay: (
        <>
          {deco &&
            strips.map((r, i) => (
              <span key={i} className="hf-ufo__pop" style={{ left: r.left + r.width / 2 - 12, top: r.top - 34, ...dur, animationDelay: `${i * 0.1}s` }}>
                <Glyph name={deco} size={24} />
              </span>
            ))}
          {lights && (
            <svg className="hf-ufo__in" width={ctx.W} height={ctx.H} viewBox={`0 0 ${ctx.W} ${ctx.H}`} style={{ left: 0, top: 0, ...dur }}>
              <path d={`M${strips[0].left} ${top - 6} ${strips.map((r) => `Q ${r.left + r.width / 2} ${top + 14}, ${r.right} ${top - 6}`).join(' ')}`} stroke="#555" fill="none" />
              {strips.flatMap((r, i) =>
                [0.25, 0.5, 0.75].map((f, k) => (
                  <circle
                    key={`${i}-${k}`}
                    className="hf-ufo__light"
                    cx={r.left + r.width * f}
                    cy={top - 6 + (k === 1 ? 10 : 6)}
                    r="4"
                    fill={['#C8102E', '#1F7A3A', '#F2C94C'][(i + k) % 3]}
                    style={{ animationDelay: `${-((i + k) % 3) * 0.3}s` }}
                  />
                )),
              )}
            </svg>
          )}
        </>
      ),
      setup: () => {
        const anims = caps.map((cap, i) => {
          const color = colors[i] ?? null
          const fader = cap.parentElement!.getBoundingClientRect()
          const cr = cap.getBoundingClientRect()
          const vertical = fader.height > fader.width
          let move = 'none'
          if (motion === 'drop') move = vertical ? `translateY(${fader.bottom - cr.bottom}px)` : `translateX(${fader.left - cr.left}px)`
          if (motion === 'countdown') move = vertical ? `translateY(${fader.top - cr.top}px)` : `translateX(${fader.right - cr.right}px)`
          if (motion === 'wave') move = vertical ? `translateY(${i % 2 ? 24 : -40}px)` : `translateX(${i % 2 ? -20 : 30}px)`
          const on: Keyframe = { transform: move, ...(color ? { background: color, boxShadow: `0 0 18px ${color}` } : {}) }
          const off: Keyframe = { transform: 'none' }
          const delay = motion === 'countdown' ? i * 0.03 : 0
          return cap.animate(
            [
              { offset: 0, ...off },
              { offset: 0.24 + delay, ...off, easing: 'ease-out' },
              { offset: 0.3 + delay, ...on },
              { offset: 0.5, ...on, easing: 'cubic-bezier(.3,1.4,.6,1)' },
              { offset: 0.58, ...off },
              { offset: 1, ...off },
            ],
            { duration },
          )
        })
        return untilMoved(() => anims.forEach((a) => a.cancel()))
      },
    }
  }

  // ---------- Artistas: deja algo en un track, o lo vuelve fantasma ----------
  if (id === 's-track') {
    const rows = [...document.querySelectorAll<HTMLElement>('.hf-track:not(.hf-track--cta)')].filter((el) => inView(el.getBoundingClientRect(), ctx, ctx.top + 170))
    const row = rows[season.track.target] ?? rows[0]
    if (!row) return null
    const r = row.getBoundingClientRect()
    const { x, y, beamH } = above(ctx, r, r.right - 90, 220)
    const { glyphs, note, ghost } = season.track
    const noteStyle: CSSProperties = { left: r.left + 8, top: r.bottom + 6, color: acc, ...dur }
    return {
      path: hover(ctx, x, y),
      beam: { w: 80, h: beamH, kind: 'single' },
      overlay: (
        <>
          {glyphs && (
            <span className="hf-ufo__drop" style={{ left: r.right - 40 - glyphs.length * 26, top: r.top + r.height / 2 - 18, display: 'flex', alignItems: 'flex-end', gap: 4, ...dur }}>
              {glyphs.map((g, i) => (
                <Glyph key={i} name={g} size={g === 'papel' ? Math.min(220, r.width * 0.5) : 30} />
              ))}
            </span>
          )}
          {note && (
            <span className="hf-ufo__note-text hf-ufo__in" style={noteStyle}>
              {note}
            </span>
          )}
          {ghost && (
            <span className="hf-ufo__bubble" style={{ left: r.right - 80, top: r.top - 18, ...dur }}>
              {ghost}
            </span>
          )}
        </>
      ),
      setup: () => {
        const anim = ghost
          ? row.animate(
              [
                { offset: 0, opacity: 1, transform: 'none', filter: 'none' },
                { offset: 0.25, opacity: 1, transform: 'none', filter: 'none' },
                { offset: 0.3, opacity: 0.35, transform: 'translateX(8px)', filter: 'blur(1px)' },
                { offset: 0.56, opacity: 0.35, transform: 'translateX(-4px)', filter: 'blur(1px)' },
                { offset: 0.62, opacity: 1, transform: 'none', filter: 'none' },
                { offset: 1, opacity: 1, transform: 'none', filter: 'none' },
              ],
              { duration },
            )
          : null
        return untilMoved(() => anim?.cancel())
      },
    }
  }

  // ---------- Reservar: el día de la temporada con su sello y etiqueta (solo visual) ----------
  if (id === 's-dia') {
    const day = [...document.querySelectorAll<HTMLButtonElement>('.hf-cal__day')].find(
      (d) => d.textContent?.trim() === String(season.day.day) && inView(d.getBoundingClientRect(), ctx, ctx.top + 150),
    )
    if (!day) return null
    const r = day.getBoundingClientRect()
    const { x, y, beamH } = above(ctx, r, undefined, 200)
    const cs = getComputedStyle(day)
    const off = { background: cs.backgroundColor, color: cs.color, borderColor: cs.borderColor, boxShadow: 'none' }
    const on = { background: acc, color: '#000', borderColor: acc, boxShadow: `0 0 22px ${acc}` }
    return {
      path: hover(ctx, x, y),
      beam: { w: 70, h: beamH, kind: 'single' },
      overlay: (
        <>
          <span className="hf-ufo__pop" style={{ left: r.right - 14, top: r.top - 12, ...dur }}>
            <Glyph name={season.day.glyph} size={22} />
          </span>
          <span className="hf-ufo__tip" style={{ left: r.left + r.width / 2, top: r.bottom + 8, borderColor: acc, color: acc, ...dur }}>
            {season.day.tip}
          </span>
        </>
      ),
      setup: () => {
        const anim = day.animate(
          [{ offset: 0, ...off }, { offset: 0.24, ...off }, { offset: 0.28, ...on }, { offset: 0.56, ...on }, { offset: 0.62, ...off }, { offset: 1, ...off }],
          { duration },
        )
        return untilMoved(() => anim.cancel())
      },
    }
  }

  // ---------- Contacto: escribe el correo de la temporada ----------
  if (id === 's-correo') return typingPlan(ctx, season.email, acc)

  // ---------- Ticker: cambia una palabra por la de la temporada (o suelta murciélagos) ----------
  const track = document.querySelector<HTMLElement>('.hf-ticker__track')
  const words = [...document.querySelectorAll<HTMLElement>('.hf-ticker__half > span:not(.hf-ticker__sep)')].filter((w) => {
    const r = w.getBoundingClientRect()
    return r.left > 60 && r.right < ctx.W - 60 && r.top >= ctx.top + 150 && r.bottom <= ctx.H
  })
  if (!track || words.length === 0) return null
  const word = words.find((w) => w.textContent === 'Mezcla') ?? pick(words)
  const r = word.getBoundingClientRect()
  const { x, y, beamH } = above(ctx, r, undefined, 200)
  const { word: next, color, bats } = season.ticker
  return {
    path: hover(ctx, x, y),
    beam: { w: 70, h: beamH, kind: 'single' },
    overlay: (
      <>
        {next && (
          <span className="hf-ufo__swap" style={{ left: r.left + r.width / 2, top: r.top, height: r.height, lineHeight: `${r.height}px`, ...fontOf(word), color, textShadow: `0 0 12px ${color}`, ...dur }}>
            {next}
          </span>
        )}
        {bats &&
          [-60, -10, 40, 90].map((bx, i) => (
            <span key={bx} className="hf-ufo__batfly" style={{ left: r.left + r.width / 2 - 12, top: r.top, '--bx': `${bx}px`, ...dur, animationDelay: `${i * 0.25}s` } as CSSProperties}>
              <Glyph name="bat" size={26} />
            </span>
          ))}
      </>
    ),
    setup: () => {
      const running = track.getAnimations()
      running.forEach((a) => a.pause())
      const hide = next
        ? word.animate([{ offset: 0, opacity: 1 }, { offset: 0.25, opacity: 1 }, { offset: 0.3, opacity: 0 }, { offset: 0.56, opacity: 0 }, { offset: 0.62, opacity: 1 }, { offset: 1, opacity: 1 }], { duration })
        : null
      return untilMoved(() => {
        hide?.cancel()
        running.forEach((a) => a.play())
      })
    },
  }
}
