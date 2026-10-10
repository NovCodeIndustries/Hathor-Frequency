import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { reviews } from '../../data/reviews'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { ReviewModal } from './ReviewModal'
import { Stars } from './Stars'
import './Reviews.css'

/**
 * Página Opiniones (canvas https://claude.ai/artifact/R7Esqtm9Mbfyo4s5KyY7Du): resumen con el promedio
 * y las barras por calificación, filtros por servicio, tarjetas y el botón que abre "Deja tu opinión".
 */
export function Reviews() {
  const [filter, setFilter] = useState('Todas')
  // /opiniones?opinar=1 (desde Contacto) abre la ventana al llegar
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(() => params.get('opinar') === '1')
  const close = useCallback(() => {
    setOpen(false)
    if (params.has('opinar')) setParams({}, { replace: true })
  }, [params, setParams])

  const total = reviews.length
  const average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  const filters = ['Todas', ...new Set(reviews.map((r) => r.service))]
  const shown = filter === 'Todas' ? reviews : reviews.filter((r) => r.service === filter)

  return (
    <section className="hf-reviews hf-container" aria-labelledby="opiniones-title">
      <div className="hf-reviews__head">
        <div className="hf-reviews__intro">
          <Eyebrow>Opiniones</Eyebrow>
          <h1 id="opiniones-title" className="hf-h2">
            Lo que dicen <GoldText>quienes ya grabaron.</GoldText>
          </h1>
          <p className="hf-lead">Artistas y bandas que pasaron por la sala. ¿Ya grabaste con nosotros? Cuéntanos cómo sonó.</p>
        </div>

        <div className="hf-reviews__summary">
          <div className="hf-reviews__score">
            <span className="hf-reviews__avg">{average.toFixed(1)}</span>
            <Stars rating={average} size={14} />
            <span className="hf-reviews__total">
              {total} {total === 1 ? 'opinión' : 'opiniones'}
            </span>
          </div>
          <dl className="hf-reviews__bars">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = reviews.filter((r) => r.rating === n).length
              return (
                <div key={n}>
                  <dt>{n} ★</dt>
                  <dd>
                    <span className="hf-reviews__bar">
                      <span style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                    </span>
                    <span className="hf-reviews__count">{count}</span>
                  </dd>
                </div>
              )
            })}
          </dl>
          <button type="button" className="hf-btn hf-btn--primary hf-reviews__cta" onClick={() => setOpen(true)}>
            Deja tu opinión ★
          </button>
        </div>
      </div>

      <div className="hf-reviews__filters" role="group" aria-label="Filtrar por servicio">
        {filters.map((f) => (
          <button key={f} type="button" className="hf-slot hf-reviews__chip" aria-pressed={f === filter} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="hf-reviews__grid">
        {shown.map((r) => (
          <article key={`${r.name}-${r.text}`} className="hf-reviews__card">
            <div className="hf-reviews__card-top">
              <Stars rating={r.rating} />
              <span className="hf-reviews__tag">{r.service}</span>
            </div>
            <blockquote>“{r.text}”</blockquote>
            <p className="hf-reviews__by">
              <span>— {r.name}</span>
              {r.project && <span className="hf-reviews__project">{r.project}</span>}
            </p>
          </article>
        ))}
      </div>

      {open && <ReviewModal onClose={close} />}
    </section>
  )
}
