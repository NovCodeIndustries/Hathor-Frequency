import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { bookingCta, navLeft, navRight } from '../../data/site'
import { Button } from '../shared/Button'
import { Logo } from '../shared/Logo'
import { MobileMenu } from './MobileMenu'
import './Nav.css'

export function Nav() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  // Cerrar el menú al cambiar de página
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Cerrar con Escape y con clic fuera
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        burgerRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header className="hf-nav" ref={headerRef}>
      <div className="hf-nav__bar hf-container">
        {/* Desktop */}
        <nav className="hf-nav__links hf-nav__links--left" aria-label="Principal izquierda">
          {navLeft.map((l) => (
            <NavLink key={l.href} to={l.href}>{l.label}</NavLink>
          ))}
        </nav>
        <Logo size="nav" className="hf-nav__logo hf-nav__logo--desktop" />
        <div className="hf-nav__links hf-nav__links--right">
          <nav aria-label="Principal derecha" className="hf-nav__links">
            {navRight.map((l) => (
              <NavLink key={l.href} to={l.href}>{l.label}</NavLink>
            ))}
          </nav>
          <Button variant="outline-gold" to={bookingCta.href}>{bookingCta.label}</Button>
        </div>

        {/* Móvil */}
        <Logo size="navMobile" className="hf-nav__logo--mobile" />
        <div className="hf-nav__mobile-actions">
          <Button variant="outline-gold" to={bookingCta.href}>{bookingCta.label}</Button>
          <button
            ref={burgerRef}
            type="button"
            className="hf-nav__burger"
            aria-expanded={open}
            aria-controls="m-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F2C94C" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 4l10 10M14 4 4 14" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 5h14M2 9h14M2 13h14" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {open && <MobileMenu onNavigate={() => setOpen(false)} />}
    </header>
  )
}
