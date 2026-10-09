import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GoldText } from '../shared/GoldText'
import './BookingModal.css'

interface BookingModalProps {
  /** "Viernes 9 de octubre · 15:00 h · Grabación" */
  session: string
  project: string
  /** "Ana López (integrante) · +52 55 0000 0000" */
  contact: string
  onClose: () => void
}

/**
 * Confirmación al reservar: un asesor se pondrá en contacto (canvas https://claude.ai/artifact/VuPzsH4vpZaQc3XDpAXBzL).
 * Se cierra con "Entendido", la X, clic fuera o Escape; bloquea el scroll y devuelve el foco al cerrar.
 */
export function BookingModal({ session, project, contact, onClose }: BookingModalProps) {
  const okRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    okRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="hf-bmodal">
      <button type="button" className="hf-bmodal__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <div className="hf-bmodal__card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        <svg className="hf-bmodal__rings" viewBox="0 0 300 300" fill="none" aria-hidden="true" focusable="false">
          {[145, 115, 85, 55].map((r) => (
            <circle key={r} cx="150" cy="150" r={r} stroke="#F2C94C" />
          ))}
        </svg>
        <button type="button" className="hf-bmodal__close" aria-label="Cerrar" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <span className="hf-bmodal__check" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>

        <div className="hf-bmodal__text">
          <span className="hf-bmodal__kicker">Solicitud enviada</span>
          <h2 id={titleId} className="hf-bmodal__title">
            Tu sesión <GoldText strong>está en camino.</GoldText>
          </h2>
          <p id={descId} className="hf-bmodal__desc">
            Un asesor se pondrá en contacto contigo para continuar con los siguientes pasos.
          </p>
        </div>

        <dl className="hf-bmodal__summary">
          <dt>Sesión</dt>
          <dd>{session}</dd>
          <dt>Proyecto</dt>
          <dd>{project}</dd>
          <dt>Contacto</dt>
          <dd>{contact}</dd>
        </dl>

        <button ref={okRef} type="button" className="hf-btn hf-btn--primary hf-bmodal__ok" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  )
}
