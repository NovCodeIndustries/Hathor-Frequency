import type { Plugin } from '../../data/types'
import { Knob } from './Knob'
import { formatsText, knobAngle, priceText } from './pluginText'

interface PluginPedalProps {
  plugin: Plugin
  onOpen: (trigger: HTMLButtonElement) => void
}

/** P2 · Pedal de la pedalera (escritorio): brilla si el plugin está disponible */
export function PluginPedal({ plugin: p, onOpen }: PluginPedalProps) {
  const lit = p.status === 'available'
  return (
    <button type="button" className={`hf-pedal ${lit ? 'is-lit' : ''}`} aria-haspopup="dialog" onClick={(e) => onOpen(e.currentTarget)}>
      <span className="hf-pedal__box" aria-hidden="true">
        <span className="hf-pedal__knobs">
          {p.controls.slice(0, 2).map((c, i) => (
            <Knob key={i} angle={knobAngle(`${p.id}${c}${i}`)} size={44} />
          ))}
        </span>
        <span className={`hf-pedal__led hf-pedal__led--${p.status}`} />
        <span className="hf-pedal__plate">{p.name}</span>
        <span className="hf-pedal__cat">{p.category}</span>
        <span className="hf-pedal__switch" />
      </span>
      <span className="hf-pedal__info">
        <span className="hf-pedal__name">{p.name}</span>
        <span className="hf-pedal__formats">{formatsText(p)}</span>
        <span className={`hf-pedal__price ${p.free && p.status !== 'soon' ? 'is-free' : ''} ${p.status === 'soon' ? 'is-muted' : ''}`}>{priceText(p)}</span>
      </span>
      <span className="hf-pedal__more">Ver pedal</span>
    </button>
  )
}
