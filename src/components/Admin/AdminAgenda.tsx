import { useCallback, useEffect, useState } from 'react'
import { timeSlots } from '../../data/booking'
import { adminApi, dateFromISO, formatMoney, formatStamp, type AdminBlock, type AdminBooking, type BookingStatus, type PaymentStatus } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS_SHORT, startOfDay, toISODate } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { useAdmin } from '../../lib/useAdmin'
import { ChargeModal } from './ChargeModal'
import './AdminAgenda.css'

const STATUS_LABEL: Record<BookingStatus, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada' }
const STATUS_CHIP: Record<BookingStatus, string> = { PENDING: 'pending', CONFIRMED: 'done', CANCELLED: 'off' }
const PAY_LABEL: Record<PaymentStatus, string> = { PENDING: 'Pago pendiente', DEPOSIT: 'Anticipo', PAID: 'Pagado' }

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))

/** "13 – 19 de octubre" / "27 de octubre – 2 de noviembre" */
function weekTitle(monday: Date): string {
  const sunday = addDays(monday, 6)
  return monday.getMonth() === sunday.getMonth()
    ? `${monday.getDate()} – ${sunday.getDate()} de ${MONTHS[sunday.getMonth()]}`
    : `${monday.getDate()} de ${MONTHS[monday.getMonth()]} – ${sunday.getDate()} de ${MONTHS[sunday.getMonth()]}`
}

/**
 * Reservas · Agenda semanal (diseño A2): cuadrícula de 7 días × horarios con las reservas activas
 * (pendiente en contorno, confirmada en dorado) y los bloqueos en trama; el detalle va a la derecha.
 */
export function AdminAgenda() {
  const { refreshSummary, onError } = useAdmin()
  const [today] = useState(() => startOfDay(new Date()))
  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [blocks, setBlocks] = useState<AdminBlock[]>([])
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [charge, setCharge] = useState<'confirm' | 'edit' | null>(null)

  const from = toISODate(monday)
  const to = toISODate(addDays(monday, 6))

  useEffect(() => {
    let alive = true
    Promise.all([adminApi.bookings({ from, to }), adminApi.blocks({ from, to })])
      .then(([b, bl]) => {
        if (!alive) return
        setBookings(b)
        setBlocks(bl)
        setError('')
      })
      .catch((err) => alive && setError(onError(err)))
    return () => {
      alive = false
    }
  }, [from, to, tick, onError])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const active = bookings.filter((b) => b.status !== 'CANCELLED')
  const cancelled = bookings.length - active.length
  const bookingAt = (iso: string, time: string) => active.find((b) => b.date === iso && b.startTime === time)
  const blockAt = (iso: string, time: string) =>
    blocks.find((b) => b.date === iso && (b.startTime === null || b.startTime === time))

  // Seleccionada: la elegida o, si no, la primera pendiente de la semana
  const picked =
    bookings.find((b) => b.id === pickedId) ?? active.find((b) => b.status === 'PENDING') ?? active[0] ?? null

  const setStatus = async (status: BookingStatus) => {
    if (!picked) return
    setBusy(true)
    try {
      await adminApi.setBookingStatus(picked.id, status)
      setError('')
      reload()
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <title>Reservas · Panel</title>
      <div className="hf-agenda">
        <section className="hf-agenda__week" aria-label="Semana">
          <div className="hf-agenda__top">
            <div className="hf-agenda__nav">
              <button type="button" className="hf-admin__arrow" aria-label="Semana anterior" onClick={() => setMonday((m) => addDays(m, -7))}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
              </button>
              <h1 className="hf-agenda__title" aria-live="polite">{weekTitle(monday)}</h1>
              <button type="button" className="hf-admin__arrow" aria-label="Semana siguiente" onClick={() => setMonday((m) => addDays(m, 7))}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
              </button>
              <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setMonday(mondayOf(new Date()))}>
                Hoy
              </button>
            </div>
            <div className="hf-agenda__legend">
              <span><i className="hf-agenda__key hf-agenda__key--pending" />Pendiente</span>
              <span><i className="hf-agenda__key hf-agenda__key--done" />Confirmada</span>
              <span><i className="hf-agenda__key hf-agenda__key--blocked" />Bloqueado</span>
            </div>
          </div>

          {error && <p className="hf-admin__error" role="alert">{error}</p>}

          <div className="hf-agenda__scroll">
            <div className="hf-agenda__grid">
              <span />
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`hf-agenda__day ${d.getTime() === today.getTime() ? 'is-today' : ''} ${d < today ? 'is-past' : ''}`}
                >
                  <span className="hf-agenda__wd">{WEEKDAYS_SHORT[i]}</span>
                  <span className="hf-agenda__n">{d.getDate()}</span>
                </div>
              ))}
              {timeSlots.map((time) => (
                <div key={time} className="hf-agenda__row">
                  <span className="hf-agenda__time">{formatTime(time)}</span>
                  {days.map((d) => {
                    const iso = toISODate(d)
                    const b = bookingAt(iso, time)
                    if (b) {
                      return (
                        <button
                          key={iso}
                          type="button"
                          className={`hf-agenda__cell hf-agenda__cell--${b.status === 'CONFIRMED' ? 'done' : 'pending'}`}
                          aria-pressed={picked?.id === b.id}
                          aria-label={`${b.project}, ${b.service}, ${STATUS_LABEL[b.status]}`}
                          onClick={() => setPickedId(b.id)}
                        >
                          <span className="hf-agenda__project">{b.project}</span>
                          <span className="hf-agenda__service">{b.service}</span>
                        </button>
                      )
                    }
                    const block = blockAt(iso, time)
                    if (block) {
                      return (
                        <div key={iso} className="hf-agenda__cell hf-agenda__cell--blocked">
                          {block.reason || (block.startTime ? 'Bloqueado' : 'Cerrado')}
                        </div>
                      )
                    }
                    return <div key={iso} className="hf-agenda__cell hf-agenda__cell--free" />
                  })}
                </div>
              ))}
            </div>
          </div>
          {cancelled > 0 && (
            <p className="hf-agenda__note">
              {cancelled} {cancelled === 1 ? 'reserva cancelada' : 'reservas canceladas'} esta semana (no ocupan horario).
            </p>
          )}
        </section>

        <aside className="hf-agenda__detail" aria-label="Detalle de la reserva">
          <svg className="hf-agenda__rings" viewBox="0 0 320 320" fill="none" aria-hidden="true" focusable="false">
            {[150, 120, 90, 60].map((r) => (
              <circle key={r} cx="160" cy="160" r={r} stroke="currentColor" />
            ))}
          </svg>
          <span className="hf-agenda__kicker">Sesión</span>
          {picked ? (
            <>
              <div className="hf-agenda__head">
                <span className="hf-agenda__name">{picked.project}</span>
                <span className="hf-agenda__when">
                  {WEEKDAYS_SHORT[(dateFromISO(picked.date).getDay() + 6) % 7]} {dateFromISO(picked.date).getDate()}{' '}
                  {MONTHS[dateFromISO(picked.date).getMonth()].slice(0, 3)} · {formatTime(picked.startTime)} · {picked.service}
                </span>
              </div>
              <span className={`hf-chip hf-chip--${STATUS_CHIP[picked.status]} hf-agenda__chip`}>{STATUS_LABEL[picked.status]}</span>
              <dl className="hf-agenda__data">
                <dt>Representa</dt>
                <dd>
                  {picked.representativeName} · {picked.representativeType === 'INTEGRANTE' ? 'integrante' : 'externo'}
                </dd>
                <dt>Teléfono</dt>
                <dd><a href={`tel:${picked.phone.replace(/[^\d+]/g, '')}`}>{picked.phone}</a></dd>
                <dt>Correo</dt>
                <dd><a href={`mailto:${picked.email}`}>{picked.email}</a></dd>
                <dt>Recibida</dt>
                <dd className="hf-agenda__muted">{formatStamp(picked.createdAt)}</dd>
                {picked.status === 'CONFIRMED' && (
                  <>
                    <dt>Cobro</dt>
                    <dd>
                      {picked.amount !== null ? formatMoney(picked.amount) : 'Sin monto'} · {PAY_LABEL[picked.paymentStatus]}
                      {picked.paymentStatus === 'DEPOSIT' && picked.deposit !== null && (
                        <span className="hf-agenda__muted"> ({formatMoney(picked.deposit)} recibido)</span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
              <div className="hf-agenda__actions">
                {picked.status === 'PENDING' && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={busy} onClick={() => setCharge('confirm')}>
                    Confirmar sesión
                  </button>
                )}
                {picked.status === 'CONFIRMED' && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--ghost" disabled={busy} onClick={() => setCharge('edit')}>
                    Editar cobro
                  </button>
                )}
                {picked.status !== 'CANCELLED' ? (
                  <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => setStatus('CANCELLED')}>
                    Cancelar
                  </button>
                ) : (
                  <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => setStatus('PENDING')}>
                    Reactivar
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="hf-agenda__muted">No hay reservas esta semana.</p>
          )}
        </aside>
      </div>
      {charge && picked && (
        <ChargeModal
          booking={picked}
          mode={charge}
          onClose={() => setCharge(null)}
          onError={onError}
          onSaved={() => {
            setCharge(null)
            setError('')
            reload()
            refreshSummary()
          }}
        />
      )}
    </>
  )
}
