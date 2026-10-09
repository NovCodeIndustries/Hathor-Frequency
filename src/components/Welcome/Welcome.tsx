import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { slogan } from '../../data/site'
import { useSeason } from '../../lib/useSeason'
import { SeasonGarland } from '../Season/SeasonGarland'
import { SeasonParticles } from '../Season/SeasonParticles'
import { GoldText } from '../shared/GoldText'
import { Glyph } from '../Ufo/seasonArt'
import './Welcome.css'

/** Tiempo que tarda en "sintonizar" (0 → 100 %) antes de entrar sola */
const TUNE_MS = 4000
/** Duración del fundido de salida */
const FADE_MS = 600

const DIAL_LABELS = ['88', '92', '96', 'HF', '104', '108']
const HF_TICK = 24 // 24 / 40 = 60 %, bajo la etiqueta "HF"

const ticks = Array.from({ length: 41 }, (_, i) => ({
  kind: i === HF_TICK ? 'hf' : i % 8 === 0 ? 'major' : i % 2 === 0 ? 'mid' : 'minor',
}))

const bars = Array.from({ length: 60 }, (_, i) => {
  const env = Math.sin((Math.PI * i) / 59)
  return {
    height: Math.round(14 + 58 * env * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7)))),
    opacity: 0.35 + 0.65 * env,
    delay: ((i * 37) % 120) / 100,
  }
})

interface WelcomeProps {
  onDone: () => void
}

/** Vista de bienvenida "Sintonizando" (B3), al cargar el sitio */
export function Welcome({ onDone }: WelcomeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const season = useSeason()
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const finish = useCallback(() => setLeaving(true), [])

  // Barra de sintonía 0 → 100 %; al terminar entra sola
  useEffect(() => {
    if (leaving) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / TUNE_MS)
      setProgress(Math.round(p * 100))
      if (p < 1) frame = requestAnimationFrame(tick)
      else finish()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [leaving, finish])

  // Fundido de salida y aviso al Layout
  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(onDone, FADE_MS)
    return () => window.clearTimeout(t)
  }, [leaving, onDone])

  // Escape para entrar, foco en el diálogo y sin scroll detrás
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [finish])

  return createPortal(
    <div
      ref={ref}
      className={`hf-welcome ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hf-welcome-title"
      tabIndex={-1}
      style={{ '--fade-ms': `${FADE_MS}ms`, '--tune-ms': `${TUNE_MS}ms` } as CSSProperties}
    >
      {/* Temporada: adorno arriba y partículas detrás */}
      {season && (
        <>
          <SeasonGarland season={season} top />
          <SeasonParticles season={season} />
        </>
      )}

      {/* Dial */}
      <div className="hf-welcome__dial" aria-hidden="true">
        <div className="hf-welcome__scale">
          <div className="hf-welcome__ticks">
            {ticks.map((t, i) => (
              <span key={i} className={`hf-welcome__tick hf-welcome__tick--${t.kind}`} />
            ))}
          </div>
          <span className="hf-welcome__needle" />
        </div>
        <div className="hf-welcome__labels">
          {DIAL_LABELS.map((l) => (
            <span key={l} className={l === 'HF' ? 'is-hf' : undefined}>{l}</span>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div className="hf-welcome__brand">
        <p className="hf-welcome__kicker">
          <span className="hf-welcome__led" aria-hidden="true" />
          {season ? `Estás sintonizando · ${season.name}` : 'Estás sintonizando'}
        </p>
        <h2 id="hf-welcome-title" className="hf-welcome__title">
          <span className="hf-welcome__main">
            HATHOR
            {season && (
              <span className="hf-welcome__badge" aria-hidden="true">
                <Glyph name={season.page.logo} size={34} />
              </span>
            )}
          </span>
          <span className="hf-welcome__sub">
            <GoldText strong>Frequency</GoldText>
          </span>
        </h2>
        <p className="hf-welcome__slogan">{slogan}</p>
        {season && <p className="hf-welcome__season">{season.page.footer}</p>}
      </div>

      {/* Ecualizador + progreso */}
      <div className="hf-welcome__foot">
        <div className="hf-welcome__eq" aria-hidden="true">
          {bars.map((b, i) => (
            <span
              key={i}
              className="hf-welcome__bar"
              style={{ height: b.height, opacity: b.opacity, animationDelay: `${b.delay}s` }}
            />
          ))}
        </div>
        <div className="hf-welcome__progress">
          <span className="hf-welcome__label">Sintonizando…</span>
          <span
            className="hf-welcome__track"
            role="progressbar"
            aria-label="Sintonizando"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span className="hf-welcome__fill" style={{ width: `${progress}%` }} />
          </span>
          <span className="hf-welcome__pct" aria-hidden="true">{progress}%</span>
          <button type="button" className="hf-welcome__skip" onClick={finish}>
            Entrar ahora →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
