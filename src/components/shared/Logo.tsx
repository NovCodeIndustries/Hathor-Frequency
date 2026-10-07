import { Link } from 'react-router'
import './Logo.css'

type LogoSize = 'nav' | 'navMobile' | 'footer'

interface LogoProps {
  size?: LogoSize
  className?: string
}

export function Logo({ size = 'nav', className = '' }: LogoProps) {
  return (
    <Link to="/" className={`hf-logo hf-logo--${size} ${className}`} aria-label="Hathor Frequency, inicio">
      <span className="hf-logo__main">HATHOR</span>
      <span className="hf-logo__sub">Frequency</span>
    </Link>
  )
}
