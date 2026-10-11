import { NavLink } from 'react-router'
import { navAll } from '../../data/site'
import { useContent } from '../../lib/content'
import { useVisibleLinks } from '../../lib/siteModules'

interface MobileMenuProps {
  onNavigate: () => void
}

export function MobileMenu({ onNavigate }: MobileMenuProps) {
  const links = useVisibleLinks(navAll)
  const { slogan } = useContent('sitio')
  return (
    <nav id="m-menu" className="hf-mmenu" aria-label="Principal">
      {links.map((l, i) => (
        <NavLink key={l.href} to={l.href} onClick={onNavigate}>
          {l.label}
          <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        </NavLink>
      ))}
      <p className="hf-mmenu__slogan">{slogan}</p>
    </nav>
  )
}
