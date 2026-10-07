import { useState } from 'react'
import { services, servicesIntro } from '../../data/services'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { AlienSignal } from './AlienSignal'
import { ChannelStrip } from './ChannelStrip'
import './Services.css'

/**
 * Easter egg: CH1 abajo · CH2 mitad · CH3 arriba · CH4 mitad · CH5 abajo
 * Umbrales: abajo ≤ 15, mitad 40–60, arriba ≥ 85.
 */
type Zone = 'abajo' | 'mitad' | 'arriba'
const SECRET: Zone[] = ['abajo', 'mitad', 'arriba', 'mitad', 'abajo']

const inZone = (level: number, zone: Zone) =>
  zone === 'abajo' ? level <= 15 : zone === 'arriba' ? level >= 85 : level >= 40 && level <= 60

const matchesSecret = (levels: number[]) => SECRET.every((zone, i) => inZone(levels[i], zone))

export function Services() {
  const [levels, setLevels] = useState(() => services.map((s) => s.level))
  const [signal, setSignal] = useState(false)

  const setLevel = (index: number, value: number) => {
    const next = levels.map((l, i) => (i === index ? value : l))
    // Se dispara solo al entrar en la combinación (no se repite mientras se mantenga)
    if (matchesSecret(next) && !matchesSecret(levels)) setSignal(true)
    setLevels(next)
  }

  return (
    <section id="servicios" className="hf-services hf-container" aria-labelledby="servicios-title">
      <div className="hf-services__head">
        <div className="hf-services__title">
          <Eyebrow>Servicios</Eyebrow>
          <h1 id="servicios-title" className="hf-h2">
            Cinco canales, <GoldText>una sola mezcla.</GoldText>
          </h1>
        </div>
        <p className="hf-lead">{servicesIntro}</p>
      </div>

      <div className="hf-console">
        {services.map((s, i) => (
          <ChannelStrip key={s.ch} service={s} level={levels[i]} onLevel={(v) => setLevel(i, v)} />
        ))}
      </div>

      {signal && <AlienSignal onClose={() => setSignal(false)} />}
    </section>
  )
}
