import type { ReactNode } from 'react'
import './Eyebrow.css'

interface EyebrowProps {
  children: ReactNode
  /** Línea a ambos lados (Contacto) */
  both?: boolean
  className?: string
}

export function Eyebrow({ children, both = false, className = '' }: EyebrowProps) {
  return (
    <p className={`hf-eyebrow ${both ? 'hf-eyebrow--both' : ''} ${className}`}>
      <span className="hf-eyebrow__line" aria-hidden="true" />
      <span>{children}</span>
      {both && <span className="hf-eyebrow__line" aria-hidden="true" />}
    </p>
  )
}
