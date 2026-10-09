import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SeasonBadge } from '../Season/SeasonBadge'
import './Drawer.css'

interface DrawerProps {
  /** Línea dorada sobre el título ("Paquete 02 · Recomendado") */
  kicker: ReactNode
  title: string
  onClose: () => void
  /** Escape; por defecto cierra el panel (un panel secundario abierto puede interceptarlo) */
  onEscape?: () => void
  /** Elemento a la izquierda del título (p. ej. el mini vinilo del artista) */
  lead?: ReactNode
  /** Línea bajo el título (p. ej. el género) */
  subtitle?: ReactNode
  /** Panel secundario a la izquierda (galería del artista) */
  aside?: ReactNode
  children: ReactNode
}

/**
 * Panel de detalle que entra desde la derecha (diseño P6 de Paquetes).
 * Se cierra con la X, clic fuera o Escape; bloquea el scroll y enfoca el botón cerrar.
 */
export function Drawer({ kicker, title, onClose, onEscape, lead, subtitle, aside, children }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const escapeRef = useRef(onEscape ?? onClose)

  useEffect(() => {
    escapeRef.current = onEscape ?? onClose
  }, [onEscape, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && escapeRef.current()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  const heading = <h2 id={titleId} className="hf-drawer__title">{title}</h2>

  return createPortal(
    <div className="hf-drawer">
      <button type="button" className="hf-drawer__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      {aside}
      <div className="hf-drawer__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <svg className="hf-drawer__rings" viewBox="0 0 420 420" fill="none" aria-hidden="true" focusable="false">
          {[205, 180, 155, 130, 105, 80].map((r) => (
            <circle key={r} cx="210" cy="210" r={r} stroke="currentColor" />
          ))}
        </svg>

        <div className="hf-drawer__top">
          <span className="hf-drawer__kicker">
            {kicker} <SeasonBadge size={14} />
          </span>
          <button ref={closeRef} type="button" className="hf-drawer__close" aria-label="Cerrar" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {lead || subtitle ? (
          <div className="hf-drawer__head">
            {lead}
            <div className="hf-drawer__heading">
              {heading}
              {subtitle}
            </div>
          </div>
        ) : (
          heading
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
