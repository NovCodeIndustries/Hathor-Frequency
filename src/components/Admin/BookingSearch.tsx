import { useEffect, useId, useRef, useState } from 'react'
import { adminApi, dateFromISO, type AdminBooking } from '../../lib/adminApi'
import { MONTHS } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { STATUS_CHIP, STATUS_LABEL } from './bookingStatus'
import './BookingSearch.css'

/** "14 oct 2026" */
const shortDate = (iso: string) => {
  const d = dateFromISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/**
 * Buscador de la Agenda: reservas de cualquier fecha por proyecto, nombre, teléfono, correo o servicio
 * (`GET /api/admin/bookings/search`). Al elegir una, la Agenda va a ese día y la abre.
 */
export function BookingSearch({ onPick, onError }: { onPick: (b: AdminBooking) => void; onError: (err: unknown) => string }) {
  const id = useId()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AdminBooking[] | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const term = q.trim()

  // Se busca 250 ms después de dejar de escribir
  useEffect(() => {
    if (term.length < 2) return
    let alive = true
    const t = window.setTimeout(() => {
      adminApi
        .searchBookings(term)
        .then((r) => {
          if (!alive) return
          setResults(r)
          setError('')
        })
        .catch((err) => alive && setError(onError(err)))
    }, 250)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [term, onError])

  // Clic fuera: se cierra la lista
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const clear = () => {
    setQ('')
    setResults(null)
    setOpen(false)
  }
  const shown = term.length >= 2 ? results : null

  return (
    <div className="hf-bsearch" ref={box}>
      <div className="hf-admin__search hf-bsearch__field" role="search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="m11 11 3.5 3.5" /></svg>
        <label className="sr-only" htmlFor={`${id}-q`}>Buscar reservas</label>
        <input
          id={`${id}-q`}
          type="search"
          className="hf-admin__search-input"
          placeholder="Buscar proyecto, nombre o teléfono"
          autoComplete="off"
          aria-expanded={open && !!shown}
          aria-controls={`${id}-list`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && clear()}
        />
        {q && (
          <button type="button" className="hf-admin__search-clear" aria-label="Borrar búsqueda" onClick={clear}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        )}
      </div>
      {open && term.length >= 2 && (
        <div id={`${id}-list`} className="hf-bsearch__list" role="listbox" aria-label="Reservas encontradas">
          {error && <p className="hf-bsearch__empty">{error}</p>}
          {!error && shown === null && <p className="hf-bsearch__empty">Buscando…</p>}
          {!error && shown?.length === 0 && <p className="hf-bsearch__empty">Ninguna reserva coincide con “{term}”.</p>}
          {shown?.map((b) => (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={false}
              className="hf-bsearch__item"
              onClick={() => {
                onPick(b)
                setOpen(false)
              }}
            >
              <span className="hf-bsearch__when">
                {shortDate(b.date)}
                <span>{formatTime(b.startTime)}</span>
              </span>
              <span className="hf-bsearch__who">
                {b.project}
                <span>
                  {b.representativeName} · {b.service}
                </span>
              </span>
              <span className={`hf-chip hf-chip--${STATUS_CHIP[b.status]}`}>{STATUS_LABEL[b.status]}</span>
            </button>
          ))}
          {shown && shown.length === 20 && <p className="hf-bsearch__empty">Se muestran 20; escribe más para afinar.</p>}
        </div>
      )}
    </div>
  )
}
