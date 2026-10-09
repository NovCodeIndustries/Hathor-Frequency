import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './WaveTransition.css'

/** Anillos de mayor a menor; los pares son dorados y los impares negros */
const RINGS = 8

export type WavePhase = 'cover' | 'reveal'

interface WaveTransitionProps {
  phase: WavePhase
  label: string
}

/**
 * Transición entre Servicios y Paquetes (P6): ondas doradas y negras salen del centro,
 * cubren la página (`cover`) y se recogen (`reveal`) con la otra vista ya montada.
 */
export function WaveTransition({ phase, label }: WaveTransitionProps) {
  return createPortal(
    <div className={`hf-wave hf-wave--${phase}`} aria-hidden="true">
      {Array.from({ length: RINGS }, (_, i) => (
        <span
          key={i}
          className={`hf-wave__ring ${i % 2 === 0 ? 'hf-wave__ring--gold' : ''}`}
          style={{ '--i': i, '--size': `${150 - i * 16}vmax` } as CSSProperties}
        />
      ))}
      <span className="hf-wave__label">{label}</span>
    </div>,
    document.body,
  )
}
