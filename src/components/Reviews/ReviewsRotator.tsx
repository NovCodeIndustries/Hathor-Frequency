import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { reviewRotateMs, reviews } from '../../data/reviews'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Stars } from './Stars'
import './Reviews.css'

/**
 * Opiniones que van cambiando en Contacto (en lugar del testimonio fijo): fundido cada `reviewRotateMs`,
 * puntos para elegir una y barra de tiempo. Se pausa con el mouse encima, con el foco dentro, al elegir
 * una a mano y con reduced-motion.
 */
export function ReviewsRotator() {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [picked, setPicked] = useState(false)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const running = reviews.length > 1 && !hovered && !picked && !reducedMotion

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % reviews.length), reviewRotateMs)
    return () => window.clearTimeout(t)
  }, [running, index])

  if (reviews.length === 0) return null

  return (
    <section
      className="hf-rotator"
      aria-label="Opiniones"
      aria-roledescription="carrusel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
      }}
    >
      <div className="hf-rotator__stage" aria-live={running ? 'off' : 'polite'}>
        {reviews.map((r, i) => (
          <figure key={`${r.name}-${i}`} className={`hf-rotator__item ${i === index ? 'is-current' : ''}`} aria-hidden={i !== index}>
            <Stars rating={r.rating} />
            <blockquote>“{r.text}”</blockquote>
            <figcaption>
              — {r.name} · {r.service}
            </figcaption>
          </figure>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="hf-rotator__dots">
          {reviews.map((r, i) => (
            <button
              key={`${r.name}-${i}`}
              type="button"
              aria-label={`Ver opinión ${i + 1} de ${reviews.length}`}
              aria-pressed={i === index}
              onClick={() => {
                setIndex(i)
                setPicked(true)
              }}
            >
              <span />
            </button>
          ))}
        </div>
      )}
      {running && <span key={index} className="hf-rotator__timer" style={{ animationDuration: `${reviewRotateMs}ms` }} aria-hidden="true" />}

      <Link to="/opiniones?opinar=1" className="hf-rotator__link">
        ¿Ya grabaste con nosotros? <span>Deja tu opinión →</span>
      </Link>
    </section>
  )
}
