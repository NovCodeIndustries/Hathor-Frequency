import type { ReactNode } from 'react'
import './GoldText.css'

interface GoldTextProps {
  children: ReactNode
  /** Glow más intenso (hero y Contacto) */
  strong?: boolean
}

export function GoldText({ children, strong = false }: GoldTextProps) {
  return <span className={`hf-gold-text ${strong ? 'hf-gold-text--strong' : ''}`}>{children}</span>
}
