import { useState } from 'react'
import { useContent } from '../../lib/content'
import type { Maintenance as MaintenanceState } from '../../lib/siteModules'
import { describeReturn, MAINTENANCE_DEFAULT_MESSAGE } from '../../lib/maintenance'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { VinylRings } from '../shared/VinylRings'
import './Maintenance.css'

/** Pantalla completa de la web en mantenimiento (panel · Sitio): reemplaza todo el sitio, sin nav ni footer */
export function Maintenance({ state }: { state: MaintenanceState }) {
  const { socials } = useContent('sitio')
  const [now] = useState(() => Date.now())
  // Si el regreso estimado ya pasó, no se promete una hora vieja
  const back = state.until && new Date(state.until).getTime() > now ? describeReturn(state.until, now) : null

  return (
    <main className="hf-maint" aria-labelledby="maint-title">
      <title>En mantenimiento · Hathor Frequency</title>
      <meta name="robots" content="noindex" />
      <VinylRings
        className="hf-maint__rings"
        size={420}
        radii={[205, 180, 155, 130, 105, 80]}
        strokeOpacity={0.6}
        center={{ r: 40, opacity: 0.5, dot: 4 }}
      />
      <div className="hf-maint__logo" aria-label="Hathor Frequency">
        <span className="hf-maint__logo-main">HATHOR</span>
        <span className="hf-maint__logo-sub">Frequency</span>
      </div>
      <Eyebrow both>En mantenimiento</Eyebrow>
      <h1 id="maint-title" className="hf-h2 hf-maint__title">
        Volvemos <GoldText strong>pronto.</GoldText>
      </h1>
      <p className="hf-maint__text">{state.message || MAINTENANCE_DEFAULT_MESSAGE}</p>
      {back && <p className="hf-maint__back">Regreso estimado: {back}</p>}
      {socials.length > 0 && (
        <nav className="hf-maint__social" aria-label="Redes sociales">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </nav>
      )}
    </main>
  )
}
