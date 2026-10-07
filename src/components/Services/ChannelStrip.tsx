import type { CSSProperties } from 'react'
import type { Point, Service } from '../../data/types'
import { Fader } from './Fader'

function Knob({ to }: { to: Point }) {
  return (
    <svg className="hf-strip__knob" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="15" fill="#111" stroke="#444" />
      <line x1="17" y1="17" x2={to[0]} y2={to[1]} stroke="#F2C94C" strokeWidth="2" />
    </svg>
  )
}

interface ChannelStripProps {
  service: Service
  level: number
  onLevel: (value: number) => void
}

export function ChannelStrip({ service, level, onLevel }: ChannelStripProps) {
  return (
    <article className="hf-strip" style={{ '--level': level } as CSSProperties}>
      <div className="hf-strip__top">
        <span className="hf-strip__ch">CH {service.ch}</span>
        <span className="hf-strip__led" aria-hidden="true" />
        <span className="hf-strip__knobs" aria-hidden="true">
          <Knob to={service.knobs[0]} />
          <Knob to={service.knobs[1]} />
        </span>
      </div>

      <Fader label={`Nivel de ${service.name}`} value={level} onChange={onLevel} />

      <div className="hf-strip__body">
        <h3>{service.name}</h3>
        <p>{service.description}</p>
      </div>
    </article>
  )
}
