import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './TuneTransition.css'

export type TunePhase = 'cover' | 'reveal'

/** Marcas del dial (cada 2.5 %): largas cada 8, medianas cada 2 */
const TICKS = Array.from({ length: 41 }, (_, i) => (i % 8 === 0 ? 'major' : i % 2 === 0 ? 'mid' : 'minor'))

/** Posición de cada estación en el dial */
const STATION = { servicios: '22%', paquetes: '78%' } as const

interface TuneTransitionProps {
  phase: TunePhase
  target: 'servicios' | 'paquetes'
}

/**
 * Transición entre Servicios y Paquetes, T4 · Cambio de frecuencia
 * (canvas https://claude.ai/artifact/1ctemxisxvpxAX3Y6oHpGm): la página se apaga con estática,
 * aparece un dial de radio y la aguja viaja a la otra estación ("Sintonizando Paquetes…");
 * al revelar, todo se desvanece con la otra vista ya montada.
 */
export function TuneTransition({ phase, target }: TuneTransitionProps) {
  const from = target === 'paquetes' ? 'servicios' : 'paquetes'
  return createPortal(
    <div
      className={`hf-tune hf-tune--${phase}`}
      style={{ '--from': STATION[from], '--to': STATION[target] } as CSSProperties}
      aria-hidden="true"
    >
      <span className="hf-tune__static" />
      <div className="hf-tune__dial">
        <div className="hf-tune__scale">
          {TICKS.map((kind, i) => (
            <span key={i} className={`hf-tune__tick hf-tune__tick--${kind}`} style={{ left: `${i * 2.5}%` }} />
          ))}
          <span className="hf-tune__needle" />
        </div>
        <div className="hf-tune__labels">
          <span className={target === 'servicios' ? 'is-target' : undefined}>Servicios</span>
          <span className={target === 'paquetes' ? 'is-target' : undefined}>Paquetes</span>
        </div>
        <span className="hf-tune__tuning">
          Sintonizando <b>{target === 'paquetes' ? 'Paquetes' : 'Servicios'}</b>…
        </span>
      </div>
    </div>,
    document.body,
  )
}
