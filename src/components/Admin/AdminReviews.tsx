import { useEffect, useState } from 'react'
import { adminApi, formatStamp, type AdminReview, type ReviewStatus } from '../../lib/adminApi'
import { Stars } from '../Reviews/Stars'
import '../Reviews/Reviews.css'
import { useAdmin } from '../../lib/useAdmin'
import './AdminReviews.css'

const FILTERS: { label: string; status: ReviewStatus | null }[] = [
  { label: 'Todas', status: null },
  { label: 'Pendientes', status: 'PENDING' },
  { label: 'Publicadas', status: 'PUBLISHED' },
  { label: 'Rechazadas', status: 'REJECTED' },
]

const STATUS: Record<ReviewStatus, { label: string; chip: string }> = {
  PENDING: { label: 'Pendiente', chip: 'pending' },
  PUBLISHED: { label: 'Publicada', chip: 'done' },
  REJECTED: { label: 'Rechazada', chip: 'off' },
}

/** Opiniones · tarjetas (diseño O2): filtros por estado y acciones en cada tarjeta */
export function AdminReviews() {
  const { refreshSummary, onError } = useAdmin()
  const [reviews, setReviews] = useState<AdminReview[] | null>(null)
  const [filter, setFilter] = useState<ReviewStatus | null>('PENDING')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.reviews().then(setReviews).catch((err) => setError(onError(err)))
  }, [onError])

  const setStatus = async (id: string, status: ReviewStatus) => {
    setBusyId(id)
    try {
      const updated = await adminApi.setReviewStatus(id, status)
      setReviews((list) => list?.map((r) => (r.id === id ? updated : r)) ?? null)
      setError('')
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusyId(null)
    }
  }

  const all = reviews ?? []
  const shown = filter ? all.filter((r) => r.status === filter) : all

  return (
    <>
      <title>Opiniones · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">Opiniones</h1>
          <p className="hf-admin__lead">Solo las publicadas aparecen en el sitio.</p>
        </div>
        <div className="hf-admin__filters" role="group" aria-label="Estado">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className="hf-admin__filter"
              aria-pressed={filter === f.status}
              onClick={() => setFilter(f.status)}
            >
              {f.label} · {f.status ? all.filter((r) => r.status === f.status).length : all.length}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      {reviews && shown.length === 0 && <p className="hf-admin__empty">No hay opiniones aquí.</p>}

      <div className="hf-areviews" aria-busy={reviews === null}>
        {shown.map((r) => {
          const busy = busyId === r.id
          return (
            <article key={r.id} className={`hf-areviews__card is-${r.status.toLowerCase()}`}>
              <div className="hf-areviews__top">
                <Stars rating={r.rating} />
                <span className={`hf-chip hf-chip--${STATUS[r.status].chip}`}>{STATUS[r.status].label}</span>
              </div>
              <blockquote className="hf-areviews__text">“{r.text}”</blockquote>
              <div className="hf-areviews__by">
                <span>
                  — {r.name}
                  {r.project && <span className="hf-areviews__muted"> · {r.project}</span>}
                  <span className="hf-areviews__muted"> · {r.service}</span>
                </span>
                <span className={r.consent ? 'hf-areviews__muted' : 'hf-areviews__anon'}>
                  {r.consent ? 'Con su nombre' : 'Saldrá como “Anónimo”'} · {formatStamp(r.createdAt)}
                </span>
              </div>
              <div className="hf-areviews__actions">
                {r.status === 'PENDING' && (
                  <>
                    <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={busy} onClick={() => setStatus(r.id, 'PUBLISHED')}>
                      Publicar
                    </button>
                    <button type="button" className="hf-admin__btn hf-admin__btn--sm" disabled={busy} onClick={() => setStatus(r.id, 'REJECTED')}>
                      Rechazar
                    </button>
                  </>
                )}
                {r.status === 'PUBLISHED' && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" disabled={busy} onClick={() => setStatus(r.id, 'REJECTED')}>
                    Ocultar
                  </button>
                )}
                {r.status === 'REJECTED' && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" disabled={busy} onClick={() => setStatus(r.id, 'PUBLISHED')}>
                    Publicar de todos modos
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
