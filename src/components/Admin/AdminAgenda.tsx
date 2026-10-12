import { useCallback, useEffect, useState } from 'react'
import { timeSlots } from '../../data/booking'
import { adminApi, dateFromISO, formatMoney, formatStamp, type AdminBlock, type AdminBooking, type BookingStatus, type PaymentStatus } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS, WEEKDAYS_SHORT, addMonths, compareMonths, startOfDay, toISODate, type YearMonth } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { useAdmin } from '../../lib/useAdmin'
import { useAdminLive } from '../../lib/useAdminLive'
import { ChargeModal } from './ChargeModal'
import { MonthPair, type DayMark } from './MonthPair'
import './AdminAgenda.css'

const STATUS_LABEL: Record<BookingStatus, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Terminada' }
const STATUS_CHIP: Record<BookingStatus, string> = { PENDING: 'pending', CONFIRMED: 'done', CANCELLED: 'off', COMPLETED: 'finished' }
const STATUS_MARK: Record<BookingStatus, DayMark | null> = { PENDING: 'pending', CONFIRMED: 'done', COMPLETED: 'finished', CANCELLED: null }
const PAY_LABEL: Record<PaymentStatus, string> = { PENDING: 'Pago pendiente', DEPOSIT: 'Anticipo', PAID: 'Pagado' }

const lastOf = ({ year, month }: YearMonth) => new Date(year, month + 1, 0)

/**
 * Reservas: dos meses en pantalla (el actual y el siguiente) con una marca por reserva
 * (contorno = pendiente, dorado = confirmada, dorado oscuro = terminada) y trama en los días cerrados.
 * A la derecha, los horarios del día elegido y el detalle de la reserva.
 */
export function AdminAgenda() {
  const { refreshSummary, onError } = useAdmin()
  const [today] = useState(() => startOfDay(new Date()))
  const current: YearMonth = { year: today.getFullYear(), month: today.getMonth() }
  const [start, setStart] = useState<YearMonth>(current)
  const [day, setDay] = useState(() => toISODate(today))
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [blocks, setBlocks] = useState<AdminBlock[]>([])
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [charge, setCharge] = useState<'confirm' | 'edit' | null>(null)

  const from = toISODate(new Date(start.year, start.month, 1))
  const to = toISODate(lastOf(addMonths(start, 1)))

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
  // En tiempo real: una reserva nueva o un cambio desde otra sesión vuelve a cargar
  useAdminLive(['booking', 'block'], reload)

  const active = bookings.filter((b) => b.status !== 'CANCELLED')
  const dayBookings = bookings.filter((b) => b.date === day)
  const cancelledToday = dayBookings.filter((b) => b.status === 'CANCELLED')
  const bookingAt = (time: string) => dayBookings.find((b) => b.startTime === time && b.status !== 'CANCELLED')
  const blockAt = (time: string) => blocks.find((b) => b.date === day && (b.startTime === null || b.startTime === time))

  // Seleccionada: la elegida o, si no, la primera del día (pendiente primero)
  const picked =
    bookings.find((b) => b.id === pickedId) ??
    dayBookings.find((b) => b.status === 'PENDING') ??
    dayBookings.find((b) => b.status !== 'CANCELLED') ??
    null

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

  const selDate = dateFromISO(day)
  const pendingCount = active.filter((b) => b.status === 'PENDING' && b.date >= toISODate(today)).length

  return (
    <>
      <title>Reservas · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">Reservas</h1>
          <p className="hf-admin__lead">{pendingCount ? `${pendingCount} por confirmar en estos dos meses.` : 'Nada por confirmar en estos dos meses.'}</p>
        </div>
        <div className="hf-agenda__legend">
          <span><i className="hf-agenda__key hf-agenda__key--pending" />Pendiente</span>
          <span><i className="hf-agenda__key hf-agenda__key--done" />Confirmada</span>
          <span><i className="hf-agenda__key hf-agenda__key--finished" />Terminada</span>
          <span><i className="hf-agenda__key hf-agenda__key--blocked" />Cerrado</span>
        </div>
      </div>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-agenda">
        <div className="hf-agenda__cal">
          <MonthPair
            start={start}
            today={today}
            selected={day}
            canPrev={compareMonths(start, addMonths(current, -12)) > 0}
            onShift={(d) => setStart((m) => addMonths(m, d))}
            onSelect={(d) => {
              setDay(toISODate(d))
              setPickedId(null)
            }}
            dayInfo={(iso) => {
              const list = active.filter((b) => b.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime))
              const dayBlocks = blocks.filter((b) => b.date === iso)
              return {
                closed: dayBlocks.some((b) => b.startTime === null),
                partial: dayBlocks.length > 0,
                marks: list.map((b) => STATUS_MARK[b.status]).filter((m): m is DayMark => !!m),
              }
            }}
          />
        </div>

        <div className="hf-agenda__side">
          <section className="hf-agenda__dayview" aria-label="Horarios del día">
            <span className="hf-agenda__kicker">Día elegido</span>
            <h2 className="hf-agenda__dayname">
              {WEEKDAYS[(selDate.getDay() + 6) % 7]} {selDate.getDate()} de {MONTHS[selDate.getMonth()]}
            </h2>
            <ol className="hf-agenda__slots">
              {timeSlots.map((time) => {
                const b = bookingAt(time)
                const block = blockAt(time)
                return (
                  <li key={time} className="hf-agenda__slot">
                    <span className="hf-agenda__slot-time">{formatTime(time)}</span>
                    {b ? (
                      <button
                        type="button"
                        className={`hf-agenda__cell hf-agenda__cell--${b.status === 'PENDING' ? 'pending' : b.status === 'COMPLETED' ? 'finished' : 'done'}`}
                        aria-pressed={picked?.id === b.id}
                        aria-label={`${b.project}, ${b.service}, ${STATUS_LABEL[b.status]}`}
                        onClick={() => setPickedId(b.id)}
                      >
                        <span className="hf-agenda__project">{b.project}</span>
                        <span className="hf-agenda__service">{b.service}</span>
                      </button>
                    ) : block ? (
                      <span className="hf-agenda__cell hf-agenda__cell--blocked">{block.reason || (block.startTime ? 'Bloqueado' : 'Cerrado')}</span>
                    ) : (
                      <span className="hf-agenda__cell hf-agenda__cell--free">Libre</span>
                    )}
                  </li>
                )
              })}
            </ol>
            {cancelledToday.length > 0 && (
              <div className="hf-agenda__cancelled">
                <span className="hf-agenda__muted">Canceladas este día:</span>
                {cancelledToday.map((b) => (
                  <button key={b.id} type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setPickedId(b.id)}>
                    {formatTime(b.startTime)} · {b.project}
                  </button>
                ))}
              </div>
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
                {(picked.status === 'CONFIRMED' || picked.status === 'COMPLETED') && (
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
                {/* Terminada = cuenta en la cifra "Proyectos" de la web */}
                {picked.status === 'CONFIRMED' && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={busy} onClick={() => setStatus('COMPLETED')}>
                    Marcar como terminada
                  </button>
                )}
                {(picked.status === 'CONFIRMED' || picked.status === 'COMPLETED') && (
                  <button type="button" className="hf-admin__btn hf-admin__btn--ghost" disabled={busy} onClick={() => setCharge('edit')}>
                    Editar cobro
                  </button>
                )}
                {picked.status === 'COMPLETED' ? (
                  <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => setStatus('CONFIRMED')}>
                    Reabrir (quitar de Proyectos)
                  </button>
                ) : picked.status !== 'CANCELLED' ? (
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
            <p className="hf-agenda__muted">Elige un día con reservas o un horario ocupado para ver el detalle.</p>
          )}
          </aside>
        </div>
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
