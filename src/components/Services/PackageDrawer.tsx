import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Package } from '../../data/types'
import { Button } from '../shared/Button'
import './PackageDrawer.css'

interface PackageDrawerProps {
  pkg: Package
  onClose: () => void
}

/** Detalle completo del paquete: panel que entra desde la derecha */
export function PackageDrawer({ pkg, onClose }: PackageDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return createPortal(
    <div className="hf-drawer">
      <button type="button" className="hf-drawer__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <div className="hf-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="hf-drawer-title">
        <svg className="hf-drawer__rings" viewBox="0 0 420 420" fill="none" aria-hidden="true" focusable="false">
          {[205, 180, 155, 130, 105, 80].map((r) => (
            <circle key={r} cx="210" cy="210" r={r} stroke="#F2C94C" />
          ))}
        </svg>

        <div className="hf-drawer__top">
          <span className="hf-drawer__kicker">
            Paquete {pkg.n} · {pkg.tag}
          </span>
          <button ref={closeRef} type="button" className="hf-drawer__close" aria-label="Cerrar" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <h2 id="hf-drawer-title" className="hf-drawer__title">{pkg.name}</h2>
        <p className="hf-drawer__price">
          <span>{pkg.price}</span> MXN · [IVA]
        </p>
        <p className="hf-drawer__desc">{pkg.description}</p>

        <h3 className="hf-drawer__h3">Lado A · Incluye</h3>
        <ol className="hf-drawer__list">
          {pkg.includes.map((item, i) => (
            <li key={item}>
              <span>A{i + 1}</span>
              {item}
            </li>
          ))}
        </ol>

        <dl className="hf-drawer__meta">
          <div>
            <dt>Entrega:</dt>
            <dd>{pkg.delivery}</dd>
          </div>
          <div>
            <dt>Sesiones:</dt>
            <dd>{pkg.sessions}</dd>
          </div>
        </dl>

        <Button variant="primary" to="/reservar" block className="hf-drawer__cta">
          Reservar este paquete
        </Button>
      </div>
    </div>,
    document.body,
  )
}
