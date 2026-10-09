import type { CSSProperties } from 'react'
import type { Point, Service } from '../../data/types'
import { DB_MARKS, levelToDb } from './db'
import { Fader } from './Fader'

function Knob({ to }: { to: Point }) {
  return (
    <svg className="hf-strip__knob" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="15" fill="#111" stroke="#444" />
      <line x1="17" y1="17" x2={to[0]} y2={to[1]} stroke="#F2C94C" strokeWidth="2" />
    </svg>
  )
}

/** Escala en dB junto al fader, como en las consolas */
function DbScale() {
  return (
    <span className="hf-strip__scale" aria-hidden="true">
      {DB_MARKS.map((m) => (
        <span
          key={m.label}
          className={`hf-strip__mark ${m.minor ? 'is-minor' : ''} ${m.label === '0' ? 'is-zero' : ''}`}
          style={{ '--mark': m.level } as CSSProperties}
        >
          {m.label}
        </span>
      ))}
    </span>
  )
}

interface ChannelStripProps {
  service: Service
  level: number
  onLevel: (value: number) => void
  /** El fader está en su posición del easter egg (tras moverlo el usuario) */
  locked?: boolean
}

export function ChannelStrip({ service, level, onLevel, locked = false }: ChannelStripProps) {
  return (
    <article className={`hf-strip ${locked ? 'is-locked' : ''}`} style={{ '--level': level } as CSSProperties}>
      <div className="hf-strip__top">
        <span className="hf-strip__ch">CH {service.ch}</span>
        <span className="hf-strip__led" aria-hidden="true" />
        <span className="hf-strip__knobs" aria-hidden="true">
          <Knob to={service.knobs[0]} />
          <Knob to={service.knobs[1]} />
        </span>
      </div>

      <div className="hf-strip__faderwrap">
        <Fader label={`Nivel de ${service.name}`} value={level} onChange={onLevel} locked={locked} />
        <DbScale />
      </div>

      <div className="hf-strip__body">
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <span className="hf-strip__db" aria-hidden="true">{levelToDb(level)}</span>
      </div>
    </article>
  )
}
