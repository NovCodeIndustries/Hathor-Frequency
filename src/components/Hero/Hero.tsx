import { slogan } from '../../data/site'
import { stats } from '../../data/stats'
import { Button } from '../shared/Button'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { VinylRings } from '../shared/VinylRings'
import './Hero.css'

export function Hero() {
  return (
    <section className="hf-hero" aria-labelledby="hero-title">
      <div className="hf-hero__inner hf-container">
        <div className="hf-hero__left">
          <Eyebrow className="hf-hero__eyebrow">Sello discográfico independiente</Eyebrow>
          <h1 id="hero-title" className="hf-hero__title">
            Donde la música <GoldText strong>toma forma.</GoldText>
          </h1>
          <div className="hf-hero__copy">
            <p className="hf-hero__subtitle">Producción musical, video y live sessions para bandas emergentes.</p>
            <p className="hf-hero__slogan">{slogan}</p>
          </div>
          <div className="hf-hero__actions">
            <Button variant="primary" to="/reservar">Comenzar proyecto</Button>
            <Button variant="ghost" to="/artistas">Ver portafolio</Button>
          </div>
          <VinylRings
            className="hf-hero__rings"
            size={420}
            radii={[205, 180, 155, 130, 105, 80]}
            strokeOpacity={0.6}
            center={{ r: 40, opacity: 0.5, dot: 4 }}
          />
        </div>

        <div className="hf-hero__right">
          <p className="hf-hero__impact">
            Grabamos. <span className="hf-muted">Mezclamos.</span> Filmamos.{' '}
            <span className="hf-muted">Masterizamos.</span> Lanzamos.
          </p>
          <dl className="hf-hero__stats">
            {stats.map((s) => (
              <div key={s.label} className="hf-hero__stat">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
