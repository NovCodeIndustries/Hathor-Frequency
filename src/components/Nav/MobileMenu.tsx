import { NavLink } from 'react-router'
import { navAll, slogan } from '../../data/site'

interface MobileMenuProps {
  onNavigate: () => void
}

export function MobileMenu({ onNavigate }: MobileMenuProps) {
  return (
    <nav id="m-menu" className="hf-mmenu" aria-label="Principal">
      {navAll.map((l, i) => (
        <NavLink key={l.href} to={l.href} onClick={onNavigate}>
          {l.label}
          <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        </NavLink>
      ))}
      <p className="hf-mmenu__slogan">{slogan}</p>
    </nav>
  )
}
