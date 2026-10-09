import type { ReactNode } from 'react'
import { Link } from 'react-router'
import './Logo.css'

type LogoSize = 'nav' | 'navMobile' | 'footer'

interface LogoProps {
  size?: LogoSize
  className?: string
  /** Detalle decorativo junto a HATHOR (temporadas) */
  badge?: ReactNode
}

export function Logo({ size = 'nav', className = '', badge }: LogoProps) {
  return (
    <Link to="/" className={`hf-logo hf-logo--${size} ${className}`} aria-label="Hathor Frequency, inicio">
      <span className="hf-logo__main">HATHOR</span>
      <span className="hf-logo__sub">Frequency</span>
      {badge && (
        <span className="hf-logo__badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </Link>
  )
}
