import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { ratingLabels, reviewMaxLength } from '../../data/reviews'
import { contactTopics } from '../../data/site'
import { submitReview } from '../../lib/submit'
import { useSeason } from '../../lib/useSeason'
import { SeasonBadge } from '../Season/SeasonBadge'
import { GoldText } from '../shared/GoldText'
import { Star } from './Stars'
import './Reviews.css'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Ventana "Deja tu opinión" (canvas https://claude.ai/artifact/R7Esqtm9Mbfyo4s5KyY7Du):
 * estrellas de 1 a 5, nombre, proyecto (opcional), servicio, opinión y permiso para publicarla.
 * Toma el color y el glifo de la temporada activa. Se cierra con la X, clic fuera o Escape.
 */
export function ReviewModal({ onClose }: { onClose: () => void }) {
  const id = useId()
  const season = useSeason()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [project, setProject] = useState('')
  const [service, setService] = useState('')
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [missingRating, setMissingRating] = useState(false)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  const shown = hover || rating

  // Flechas para cambiar la calificación desde el teclado (radiogroup)
  const onStarsKey = (e: KeyboardEvent) => {
    const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? rating + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? rating - 1 : null
    if (next === null) return
    e.preventDefault()
    setRating(Math.min(5, Math.max(1, next)))
    setMissingRating(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rating) {
      setMissingRating(true)
      return
    }
    setStatus('sending')
    try {
      await submitReview({ rating, name: name.trim(), project: project.trim(), service, text: text.trim(), consent })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return createPortal(
    <div className="hf-review">
      <button type="button" className="hf-review__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <div className="hf-review__card" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <svg className="hf-review__rings" viewBox="0 0 300 300" fill="none" aria-hidden="true" focusable="false">
          {[145, 115, 85, 55].map((r) => (
            <circle key={r} cx="150" cy="150" r={r} stroke="currentColor" />
          ))}
        </svg>
        <button ref={closeRef} type="button" className="hf-review__close" aria-label="Cerrar" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        {status === 'sent' ? (
          <div className="hf-review__thanks" role="status">
            <span className="hf-review__thanks-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} filled={n <= rating} size={34} />
              ))}
            </span>
            <h2 id={`${id}-title`} className="hf-review__title">
              ¡Gracias por <GoldText strong>tu frecuencia!</GoldText>
            </h2>
            <p className="hf-review__lead">La revisamos y, si nos diste permiso, aparecerá en Opiniones.</p>
            <button type="button" className="hf-btn hf-btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form className="hf-review__form" onSubmit={handleSubmit}>
            <div className="hf-review__head">
              <span className="hf-review__kicker">
                Opiniones <SeasonBadge size={16} />
              </span>
              <h2 id={`${id}-title`} className="hf-review__title">
                ¿Cómo sonó <GoldText strong>tu experiencia?</GoldText>
              </h2>
              <p className="hf-review__lead">Tu opinión nos ayuda a sonar mejor. La revisamos antes de publicarla.</p>
            </div>

            <fieldset className="hf-review__rating">
              <legend className="sr-only">Calificación</legend>
              <div className="hf-review__stars" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas" onKeyDown={onStarsKey} onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n === rating}
                    aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'} · ${ratingLabels[n]}`}
                    tabIndex={n === (rating || 1) ? 0 : -1}
                    className="hf-review__star"
                    onMouseEnter={() => setHover(n)}
                    onClick={() => {
                      setRating(n)
                      setMissingRating(false)
                    }}
                  >
                    <Star filled={n <= shown} size={40} />
                  </button>
                ))}
              </div>
              <span className={`hf-review__label ${shown ? 'is-on' : ''}`} aria-live="polite">
                {missingRating ? 'Elige cuántas estrellas le das' : ratingLabels[shown]}
              </span>
            </fieldset>

            <div className="hf-review__row">
              <div className="hf-review__field">
                <label htmlFor={`${id}-name`} className="hf-label">Tu nombre</label>
                <input id={`${id}-name`} className="hf-review__input" type="text" autoComplete="name" placeholder="Cómo quieres aparecer" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="hf-review__field">
                <label htmlFor={`${id}-project`} className="hf-label">
                  Banda o proyecto <span className="hf-review__optional">(opcional)</span>
                </label>
                <input id={`${id}-project`} className="hf-review__input" type="text" placeholder="Nombre del proyecto" maxLength={120} value={project} onChange={(e) => setProject(e.target.value)} />
              </div>
            </div>

            <div className="hf-review__field">
              <label htmlFor={`${id}-service`} className="hf-label">Servicio</label>
              <select id={`${id}-service`} className={`hf-review__input hf-review__select ${service ? '' : 'is-empty'}`} required value={service} onChange={(e) => setService(e.target.value)}>
                <option value="" disabled>¿Sobre qué servicio opinas?</option>
                {contactTopics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="hf-review__field">
              <label htmlFor={`${id}-text`} className="hf-label">Tu opinión</label>
              <textarea id={`${id}-text`} className="hf-review__input hf-review__textarea" rows={3} placeholder="Cuéntanos cómo te fue" required maxLength={reviewMaxLength} value={text} onChange={(e) => setText(e.target.value)} />
              <span className="hf-review__count" aria-hidden="true">{text.length} / {reviewMaxLength}</span>
            </div>

            <label className="hf-review__consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Pueden publicar mi opinión con mi nombre
            </label>

            {season && <p className="hf-review__season">{season.page.footer}</p>}

            <button type="submit" className="hf-btn hf-btn--primary hf-review__submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Enviando…' : 'Enviar opinión'}
            </button>
            <p className="hf-review__status" role="status">
              {status === 'error' && 'No pudimos enviar tu opinión. Intenta de nuevo.'}
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
