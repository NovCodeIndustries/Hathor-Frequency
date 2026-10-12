import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { sortSlots } from '../../data/booking'
import { useContent } from '../../lib/content'
import { adminApi, dateFromISO, type AdminBlock, type AdminBooking, type BookingStatus } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS, WEEKDAYS_SHORT, addMonths, startOfDay, toISODate, type YearMonth } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { useAdmin } from '../../lib/useAdmin'
import { useAdminLive } from '../../lib/useAdminLive'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { BookingDetail } from './BookingDetail'
import { BookingSearch } from './BookingSearch'
import { STATUS_LABEL } from './bookingStatus'
import { ChargeModal } from './ChargeModal'
import { MonthPair, type DayMark } from './MonthPair'
import { NewBookingModal } from './NewBookingModal'
import './AdminAgenda.css'

const STATUS_MARK: Record<BookingStatus, DayMark | null> = { PENDING: 'pending', CONFIRMED: 'done', COMPLETED: 'finished', CANCELLED: null }
const cellKind = (s: BookingStatus) => (s === 'PENDING' ? 'pending' : s === 'COMPLETED' ? 'finished' : 'done')

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))
const RANGES = [7, 14, 30] as const

type Show = { bookings: boolean; blocks: boolean; free: boolean }

/**
 * Agenda (reservas + bloqueos en una sola vista). Canvas https://claude.ai/artifact/Hs52MAuY1x4ELRaWkmRagk:
 * - escritorio, R2 · Pistas por día: cada día es una fila con sus horarios (Contenido · Horarios); clic en un hueco lo bloquea,
 *   en un bloqueo lo libera y en una sesión la abre en el panel de la derecha;
 * - móvil, R1 · Agenda única: tira de días (o el mes), los horarios del día y el detalle en una hoja inferior.
 */
export function AdminAgenda() {
  const { refreshSummary, onError, admin } = useAdmin()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [today] = useState(() => startOfDay(new Date()))
  const todayISO = toISODate(today)

  // Escritorio (R2)
  const [start, setStart] = useState(today)
  const [range, setRange] = useState<(typeof RANGES)[number]>(14)
  const [show, setShow] = useState<Show>({ bookings: true, blocks: true, free: true })
  // Móvil (R1)
  const [day, setDay] = useState(todayISO)
  const [monthOpen, setMonthOpen] = useState(false)
  const [monthStart, setMonthStart] = useState<YearMonth>({ year: today.getFullYear(), month: today.getMonth() })

  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [blocks, setBlocks] = useState<AdminBlock[]>([])
  const published = useContent('horarios').slots
  const [pickedId, setPickedId] = useState<string | null>(null)
  // Horas vigentes (Contenido · Horarios) + las de reservas activas a una hora que ya se quitó
  const timeSlots = sortSlots([...published, ...bookings.filter((b) => b.status !== 'CANCELLED').map((b) => b.startTime)])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [charge, setCharge] = useState<'confirm' | 'edit' | null>(null)
  /** Ventana "Agendar sesión" abierta con este día */
  const [newOn, setNewOn] = useState<string | null>(null)

  // Rango que se pide a la API según la vista
  const stripStart = addDays(mondayOf(dateFromISO(day)), -7)
  const fromDate = mobile ? (monthOpen ? new Date(monthStart.year, monthStart.month, 1) : stripStart) : start
  const toDate = mobile ? (monthOpen ? new Date(monthStart.year, monthStart.month + 2, 0) : addDays(stripStart, 27)) : addDays(start, range - 1)
  const from = toISODate(fromDate)
  const to = toISODate(toDate)

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
  // En tiempo real: reservas nuevas y cambios desde otra sesión
  useAdminLive(['booking', 'block'], reload)

  const bookingAt = (iso: string, time: string) => bookings.find((b) => b.date === iso && b.startTime === time && b.status !== 'CANCELLED')
  const dayBlock = (iso: string) => blocks.find((b) => b.date === iso && b.startTime === null)
  const slotBlock = (iso: string, time: string) => blocks.find((b) => b.date === iso && b.startTime === time)
  const picked = bookings.find((b) => b.id === pickedId) ?? null

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      setError('')
      reload()
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  const setStatus = (status: BookingStatus) => {
    if (picked) void run(() => adminApi.setBookingStatus(picked.id, status))
  }
  const block = (iso: string, time?: string) => void run(() => adminApi.addBlock(iso, time))
  const unblock = (b: AdminBlock) => void run(() => adminApi.removeBlock(b.id))
  const toggleDay = (iso: string) => {
    const full = dayBlock(iso)
    if (full) unblock(full)
    else block(iso)
  }

  /** Lo que hace un clic (o toque) en un horario */
  const cellAction = (iso: string, time: string): (() => void) | undefined => {
    const b = bookingAt(iso, time)
    if (b) return () => setPickedId(b.id)
    if (dayBlock(iso)) return undefined
    const sb = slotBlock(iso, time)
    if (sb) return () => unblock(sb)
    if (iso < todayISO) return undefined
    return () => block(iso, time)
  }

  /** Resultado del buscador: lleva la vista a ese día y abre la reserva */
  const goTo = (b: AdminBooking) => {
    if (mobile) {
      setMonthOpen(false)
      setDay(b.date)
    } else if (b.date < toISODate(start) || b.date > toISODate(addDays(start, range - 1))) setStart(dateFromISO(b.date))
    setPickedId(b.id)
  }
  const search = <BookingSearch onPick={goTo} onError={onError} />

  const chargeModal = charge && picked && (
    <ChargeModal
      booking={picked}
      mode={charge}
      onClose={() => setCharge(null)}
      onError={onError}
      onSaved={() => {
        setCharge(null)
        reload()
        refreshSummary()
      }}
    />
  )

  const newModal = newOn && (
    <NewBookingModal
      date={newOn}
      onClose={() => setNewOn(null)}
      onError={onError}
      onSaved={(b) => {
        setNewOn(null)
        // Lleva la vista al día de la sesión nueva y la deja elegida
        if (mobile) setDay(b.date)
        else if (b.date < toISODate(start) || b.date > toISODate(addDays(start, range - 1))) setStart(dateFromISO(b.date))
        setPickedId(b.id)
        reload()
        refreshSummary()
      }}
    />
  )

  if (mobile) {
    return (
      <>
        <title>Agenda · Panel</title>
        <MobileAgenda
          slots={timeSlots}
          today={today}
          day={day}
          setDay={(iso) => {
            setDay(iso)
            setPickedId(null)
          }}
          stripStart={stripStart}
          monthOpen={monthOpen}
          setMonthOpen={setMonthOpen}
          monthStart={monthStart}
          setMonthStart={setMonthStart}
          bookings={bookings}
          blocks={blocks}
          busy={busy}
          error={error}
          bookingAt={bookingAt}
          dayBlock={dayBlock}
          slotBlock={slotBlock}
          cellAction={cellAction}
          toggleDay={toggleDay}
          picked={picked}
          closeSheet={() => setPickedId(null)}
          onStatus={setStatus}
          onCharge={setCharge}
          onNew={() => setNewOn(day)}
          search={search}
          canEditSlots={admin.role === 'ADMIN'}
        />
        {chargeModal}
        {newModal}
      </>
    )
  }

  // ── Escritorio · R2 Pistas por día ──
  const days = Array.from({ length: range }, (_, i) => addDays(start, i))
  const inRange = bookings.filter((b) => b.status !== 'CANCELLED')
  const pendingCount = inRange.filter((b) => b.status === 'PENDING').length
  const blockedCount = days.reduce((n, d) => {
    const iso = toISODate(d)
    return n + (dayBlock(iso) ? timeSlots.length : blocks.filter((b) => b.date === iso && b.startTime).length)
  }, 0)

  return (
    <>
      <title>Agenda · Panel</title>
      <div className="hf-admin__head">
        <div>
          <span className="hf-agenda__kicker">Agenda · pistas</span>
          <h1 className="hf-admin__title">
            Reservas <span className="hf-agenda__gold">y bloqueos.</span>
          </h1>
          <p className="hf-admin__lead">Cada día es una pista con sus horarios. Clic en un hueco para bloquearlo, en un bloqueo para liberarlo y en una sesión para verla.{' '}
            {admin.role === 'ADMIN' && <Link to="/admin/contenido?seccion=horarios" className="hf-agenda__edit">Editar horas de inicio →</Link>}
          </p>
        </div>
        <div className="hf-pistas__tools">
          {search}
          <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" onClick={() => setNewOn(todayISO)}>+ Agendar sesión</button>
          <div className="hf-pistas__nav">
            <button type="button" className="hf-admin__arrow" aria-label="Días anteriores" onClick={() => setStart((s) => addDays(s, -range))}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setStart(today)}>Hoy</button>
            <button type="button" className="hf-admin__arrow" aria-label="Días siguientes" onClick={() => setStart((s) => addDays(s, range))}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
          <div className="hf-pistas__seg" role="radiogroup" aria-label="Rango">
            {RANGES.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)}>
                {r} días
              </button>
            ))}
          </div>
          <div className="hf-admin__filters" role="group" aria-label="Mostrar">
            {(
              [
                ['bookings', 'Reservas'],
                ['blocks', 'Bloqueos'],
                ['free', 'Libres'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" className="hf-admin__filter" aria-pressed={show[k]} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-pistas">
        <section className="hf-pistas__board" aria-label="Días">
          <div className="hf-pistas__inner" style={{ '--slots': timeSlots.length } as CSSProperties}>
            <div className="hf-pistas__row hf-pistas__row--head">
              <span />
              {timeSlots.map((t) => (
                <span key={t} className="hf-pistas__time">{formatTime(t)}</span>
              ))}
            </div>
            {days.map((d) => {
              const iso = toISODate(d)
              const closed = !!dayBlock(iso)
              const sessions = timeSlots.filter((t) => bookingAt(iso, t)).length
              const isToday = iso === todayISO
              const past = iso < todayISO
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={iso} className={`hf-pistas__row ${isToday ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''} ${past ? 'is-past' : ''}`}>
                  <span className="hf-pistas__day">
                    <span className="hf-pistas__dayname">
                      {WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} {d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)}
                    </span>
                    <span className="hf-pistas__daysub">{isToday ? 'Hoy' : closed ? 'Cerrado' : sessions ? `${sessions} ${sessions === 1 ? 'sesión' : 'sesiones'}` : 'Libre'}</span>
                    {!past && (
                      <button type="button" className="hf-pistas__close" disabled={busy} onClick={() => toggleDay(iso)}>
                        {closed ? 'Abrir día' : 'Cerrar día'}
                      </button>
                    )}
                  </span>
                  {timeSlots.map((t) => {
                    const b = bookingAt(iso, t)
                    const sb = slotBlock(iso, t)
                    const action = cellAction(iso, t)
                    if (b) {
                      return (
                        <button
                          key={t}
                          type="button"
                          className={`hf-pistas__cell hf-agenda__cell--${cellKind(b.status)} ${show.bookings ? '' : 'is-dim'}`}
                          aria-pressed={pickedId === b.id}
                          aria-label={`${formatTime(t)}: ${b.project}, ${b.service}, ${STATUS_LABEL[b.status]}`}
                          onClick={action}
                        >
                          <span className="hf-pistas__title">{b.project}</span>
                          <span className="hf-pistas__sub">{b.service}</span>
                        </button>
                      )
                    }
                    if (closed || sb) {
                      return (
                        <button
                          key={t}
                          type="button"
                          className={`hf-pistas__cell hf-pistas__cell--blocked ${show.blocks ? '' : 'is-dim'}`}
                          aria-label={`${formatTime(t)}: ${closed ? 'día cerrado' : 'bloqueado, clic para liberar'}`}
                          disabled={!action || busy}
                          onClick={action}
                        >
                          <span className="hf-pistas__title">{closed ? (dayBlock(iso)?.reason ?? 'Cerrado') : (sb?.reason ?? 'Bloqueado')}</span>
                          {!closed && <span className="hf-pistas__sub">liberar</span>}
                        </button>
                      )
                    }
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`hf-pistas__cell hf-pistas__cell--free ${show.free ? '' : 'is-dim'}`}
                        aria-label={`${formatTime(t)}: libre${action ? ', clic para bloquear' : ''}`}
                        disabled={!action || busy}
                        onClick={action}
                      >
                        {action && <span className="hf-pistas__sub">+ bloquear</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </section>

        <aside className="hf-agenda__detail" aria-label="Detalle de la reserva">
          <svg className="hf-agenda__rings" viewBox="0 0 320 320" fill="none" aria-hidden="true" focusable="false">
            {[150, 120, 90, 60].map((r) => (
              <circle key={r} cx="160" cy="160" r={r} stroke="currentColor" />
            ))}
          </svg>
          <span className="hf-agenda__kicker">Sesión</span>
          {picked ? (
            <BookingDetail booking={picked} busy={busy} onStatus={setStatus} onCharge={setCharge} />
          ) : (
            <p className="hf-agenda__muted">Elige una sesión en las pistas, o agenda una que te pidieron por llamada o WhatsApp.</p>
          )}
          <div className="hf-pistas__summary">
            <span className="hf-agenda__kicker hf-agenda__kicker--muted">Resumen del rango</span>
            <span>
              {inRange.length} {inRange.length === 1 ? 'sesión' : 'sesiones'} ({pendingCount} por confirmar) · {blockedCount} horarios bloqueados en {range} días
            </span>
          </div>
        </aside>
      </div>
      {chargeModal}
      {newModal}
    </>
  )
}

// ── Móvil · R1 Agenda única ──

interface MobileProps {
  /** Buscador de reservas (arriba de todo) */
  search: ReactNode
  /** El rol STAFF no edita las horas de inicio (Contenido) */
  canEditSlots: boolean
  slots: string[]
  today: Date
  day: string
  setDay: (iso: string) => void
  stripStart: Date
  monthOpen: boolean
  setMonthOpen: (v: boolean) => void
  monthStart: YearMonth
  setMonthStart: (fn: (m: YearMonth) => YearMonth) => void
  bookings: AdminBooking[]
  blocks: AdminBlock[]
  busy: boolean
  error: string
  bookingAt: (iso: string, time: string) => AdminBooking | undefined
  dayBlock: (iso: string) => AdminBlock | undefined
  slotBlock: (iso: string, time: string) => AdminBlock | undefined
  cellAction: (iso: string, time: string) => (() => void) | undefined
  toggleDay: (iso: string) => void
  picked: AdminBooking | null
  closeSheet: () => void
  onStatus: (s: BookingStatus) => void
  onCharge: (m: 'confirm' | 'edit') => void
  onNew: () => void
}

function MobileAgenda(p: MobileProps) {
  const timeSlots = p.slots
  const stripRef = useRef<HTMLDivElement>(null)
  const sel = dateFromISO(p.day)
  const todayISO = toISODate(p.today)
  const closed = !!p.dayBlock(p.day)
  const strip = Array.from({ length: 28 }, (_, i) => addDays(p.stripStart, i))

  // La tira se desplaza hasta el día elegido
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [p.day, p.monthOpen])

  const marks = (iso: string) =>
    p.bookings
      .filter((b) => b.date === iso)
      .map((b) => STATUS_MARK[b.status])
      .filter((m): m is DayMark => !!m)

  return (
    <div className="hf-magenda">
      {p.search}
      <div className="hf-magenda__top">
        <h1 className="hf-magenda__month">
          {MONTHS[sel.getMonth()][0].toUpperCase() + MONTHS[sel.getMonth()].slice(1)} {sel.getFullYear()}
        </h1>
        <button type="button" className="hf-admin__btn hf-admin__btn--sm hf-magenda__toggle" aria-expanded={p.monthOpen} onClick={() => p.setMonthOpen(!p.monthOpen)}>
          {p.monthOpen ? 'Ver semana' : 'Ver mes'}
        </button>
      </div>

      {p.monthOpen ? (
        <MonthPair
          start={p.monthStart}
          today={p.today}
          selected={p.day}
          canPrev
          onShift={(d) => p.setMonthStart((m) => addMonths(m, d))}
          onSelect={(d) => {
            p.setDay(toISODate(d))
            p.setMonthOpen(false)
          }}
          dayInfo={(iso) => {
            const dayBlocks = p.blocks.filter((b) => b.date === iso)
            return { closed: dayBlocks.some((b) => b.startTime === null), partial: dayBlocks.length > 0, marks: marks(iso) }
          }}
        />
      ) : (
        <div className="hf-magenda__strip" ref={stripRef} role="group" aria-label="Días">
          {strip.map((d) => {
            const iso = toISODate(d)
            const m = marks(iso)
            return (
              <button
                key={iso}
                type="button"
                className={`hf-magenda__day ${p.dayBlock(iso) ? 'is-closed' : ''} ${iso === todayISO ? 'is-today' : ''} ${iso < todayISO ? 'is-past' : ''}`}
                aria-pressed={iso === p.day}
                aria-label={`${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}${m.length ? `, ${m.length} reservas` : ''}`}
                onClick={() => p.setDay(iso)}
              >
                <span className="hf-magenda__wd">{WEEKDAYS_SHORT[(d.getDay() + 6) % 7]}</span>
                <span className="hf-magenda__n">{d.getDate()}</span>
                <span className="hf-mpair__marks" aria-hidden="true">
                  {m.slice(0, 3).map((x, k) => (
                    <i key={k} className={`hf-mpair__mark hf-mpair__mark--${x}`} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="hf-magenda__dayhead">
        <h2 className="hf-magenda__dayname">
          {WEEKDAYS[(sel.getDay() + 6) % 7]} {sel.getDate()} de {MONTHS[sel.getMonth()]}
        </h2>
        {p.day >= todayISO && (
          <div className="hf-magenda__dayactions">
            {!closed && (
              <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" onClick={p.onNew}>+ Agendar</button>
            )}
            <button type="button" className={`hf-admin__btn hf-admin__btn--sm ${closed ? 'hf-magenda__reopen' : ''}`} disabled={p.busy} onClick={() => p.toggleDay(p.day)}>
              {closed ? 'Abrir el día' : 'Cerrar el día'}
            </button>
          </div>
        )}
      </div>
      {p.error && <p className="hf-admin__error" role="alert">{p.error}</p>}

      <ol className="hf-magenda__slots">
        {timeSlots.map((t) => {
          const b = p.bookingAt(p.day, t)
          const sb = p.slotBlock(p.day, t)
          const action = p.cellAction(p.day, t)
          const kind = b ? cellKind(b.status) : closed || sb ? 'blocked' : 'free'
          const title = b ? b.project : closed ? 'Día cerrado' : sb ? (sb.reason ?? 'Bloqueado') : 'Libre'
          const sub = b ? `${b.service} · ${STATUS_LABEL[b.status]}` : closed ? '' : sb ? 'Toca para liberar' : action ? 'Toca para bloquear' : ''
          return (
            <li key={t} className="hf-magenda__slot">
              <span className="hf-magenda__time">{formatTime(t)}</span>
              <button
                type="button"
                className={`hf-pistas__cell ${kind === 'blocked' ? 'hf-pistas__cell--blocked' : kind === 'free' ? 'hf-pistas__cell--free' : `hf-agenda__cell--${kind}`}`}
                aria-label={`${formatTime(t)}: ${title}${sub ? `, ${sub}` : ''}`}
                disabled={!action || p.busy}
                onClick={action}
              >
                <span className="hf-pistas__title">{title}</span>
                {sub && <span className="hf-pistas__sub">{sub}</span>}
              </button>
            </li>
          )
        })}
      </ol>
      {p.canEditSlots && <Link to="/admin/contenido?seccion=horarios" className="hf-agenda__edit hf-magenda__edit">Editar horas de inicio →</Link>}

      {p.picked &&
        createPortal(
          <div className="hf-msheet">
            <button type="button" className="hf-msheet__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={p.closeSheet} />
            <div className="hf-msheet__card" role="dialog" aria-modal="true" aria-label="Detalle de la reserva">
              <span className="hf-msheet__grip" aria-hidden="true" />
              <BookingDetail booking={p.picked} busy={p.busy} onStatus={p.onStatus} onCharge={p.onCharge} />
              <button type="button" className="hf-admin__btn" onClick={p.closeSheet}>Cerrar</button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
