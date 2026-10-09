import { Fragment } from 'react'
import { slogan } from '../../data/site'
import { stats } from '../../data/stats'
import { useSeason } from '../../lib/useSeason'
import { SeasonParticles } from '../Season/SeasonParticles'
import { Glyph } from '../Ufo/seasonArt'
import { Button } from '../shared/Button'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import './Hero.css'

/** Surcos del vinilo de fondo */
const GROOVES = Array.from({ length: 9 }, (_, i) => 200 - i * 12)

/**
 * Inicio (diseño I1 · Vinilo gigante): texto centrado sobre un vinilo enorme
 * que gira despacio, con viñeta negra para leer el texto.
 */
export function Hero() {
  const season = useSeason()
  return (
    <section className="hf-hero" aria-labelledby="hero-title">
      <svg className="hf-hero__vinyl" viewBox="0 0 440 440" aria-hidden="true" focusable="false">
        <g className="hf-hero__spin">
          <circle cx="220" cy="220" r="216" fill="#0a0a0a" stroke="#333" />
          <g fill="none" stroke="#F2C94C" strokeOpacity="0.18">
            {GROOVES.map((r) => (
              <circle key={r} cx="220" cy="220" r={r} />
            ))}
          </g>
          <path d="M220 20A200 200 0 0 1 400 140" fill="none" stroke="#F2C94C" strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="220" cy="220" r="80" fill="#F2C94C" />
          <circle cx="220" cy="220" r="5" fill="#000" />
        </g>
      </svg>
      {season && (
        <div className="hf-hero__season-label" aria-hidden="true">
          <Glyph name={season.page.label} size={150} />
        </div>
      )}
      <div className="hf-hero__vignette" aria-hidden="true" />
      {season && <SeasonParticles season={season} />}

      <div className="hf-hero__content hf-container">
        <Eyebrow both>Sello discográfico independiente</Eyebrow>
        <h1 id="hero-title" className="hf-hero__title">
          Donde la música <br />
          <GoldText strong>{season?.page.heroClose ?? 'toma forma.'}</GoldText>
        </h1>
        <div className="hf-hero__copy">
          <p className="hf-hero__subtitle">Producción musical, video y live sessions para bandas emergentes.</p>
          <p className="hf-hero__slogan">{slogan}</p>
        </div>
        <div className="hf-hero__actions">
          <Button variant="primary" to="/reservar">Comenzar proyecto</Button>
          <Button variant="ghost" to="/artistas">Ver portafolio</Button>
        </div>
        <dl className="hf-hero__stats">
          {stats.map((s, i) => (
            <Fragment key={s.label}>
              {i > 0 && <span className="hf-hero__sep" aria-hidden="true">◆</span>}
              <div className="hf-hero__stat">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  )
}
