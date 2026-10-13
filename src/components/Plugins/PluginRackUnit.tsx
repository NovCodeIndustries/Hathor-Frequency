import { pluginStatusLabel } from '../../data/plugins'
import type { Plugin } from '../../data/types'
import { Knob } from './Knob'
import { knobAngle } from './pluginText'

interface PluginRackUnitProps {
  plugin: Plugin
  n: string
  onOpen: (trigger: HTMLButtonElement) => void
}

/** P1 · Unidad de rack (móvil): tornillos, perillas con nombre, LED de estado y formatos */
export function PluginRackUnit({ plugin: p, n, onOpen }: PluginRackUnitProps) {
  return (
    <button type="button" className="hf-rack-unit" aria-haspopup="dialog" onClick={(e) => onOpen(e.currentTarget)}>
      <span className="hf-rack-unit__top">
        <span className="hf-rack-unit__screw" aria-hidden="true" />
        <span className="hf-rack-unit__title">
          <span className="hf-rack-unit__num">{n} · {p.category}</span>
          <span className="hf-rack-unit__name">{p.name}</span>
        </span>
        <span className={`hf-rack-unit__led hf-rack-unit__led--${p.status}`} aria-hidden="true" />
        <span className="hf-rack-unit__status">{p.status === 'soon' ? 'Pronto' : pluginStatusLabel[p.status]}</span>
      </span>
      <span className="hf-rack-unit__knobs" aria-hidden="true">
        {p.controls.slice(0, 4).map((c, i) => (
          <span key={i} className="hf-rack-unit__knob">
            <Knob angle={knobAngle(`${p.id}${c}${i}`)} size={40} />
            <span>{c}</span>
          </span>
        ))}
      </span>
      <span className="hf-rack-unit__bottom">
        {(p.formats.length ? p.formats : ['—']).map((f) => (
          <span key={f} className="hf-rack-unit__chip">{f}</span>
        ))}
        <span className="hf-rack-unit__more">Ver</span>
      </span>
    </button>
  )
}
