import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { timeSlots } from '../../data/booking'
import { adminApi, dateFromISO, formatMoney, formatStamp, shortName, type Dashboard, type DashboardRange, type DaySlot } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS, WEEKDAYS_SHORT } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { useAdmin } from '../../lib/useAdmin'
import { ChargeModal, type ChargeTarget } from './ChargeModal'
import './AdminDashboard.css'
import { useAdminLive } from '../../lib/useAdminLive'

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: 'Año' },
]

const RING = 2 * Math.PI * 76
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
const LEDS = 20

const shortDate = (iso: string) => {
  const d = dateFromISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}
const longDate = (iso: string) => {
  const d = dateFromISO(iso)
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}
/** "▲ 20%" / "▼ 5%" / "= 0%" contra el periodo anterior */
const delta = (n: number | null, unit = '%') => (n === null ? 'sin periodo anterior' : `${n > 0 ? '▲' : n < 0 ? '▼' : '='} ${Math.abs(n)}${unit}`)

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/**
 * Inicio del panel · diseño D4 (combinada D2 × D3, canvas https://claude.ai/artifact/7wwLUsR6SBNYJoY88dma8W):
 * arriba "Hoy primero" (línea de tiempo y pendientes) y abajo el "Master del periodo" con medidores de consola.
 */
export function AdminDashboard() {
  const { admin, refreshSummary, onError } = useAdmin()
  const [range, setRange] = useState<DashboardRange>('month')
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [hover, setHover] = useState<string | null>(null)
  const [charge, setCharge] = useState<ChargeTarget | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    adminApi
      .dashboard(range)
      .then((d) => alive && (setData(d), setError('')))
      .catch((err) => alive && setError(onError(err)))
    return () => {
      alive = false
    }
  }, [range, tick, onError])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  useAdminLive(['booking', 'contact', 'review', 'block', 'content', 'site'], reload)
  const clear = () => setHover(null)

  if (!data) {
    return (
      <>
        <title>Inicio · Panel</title>
        {error ? <p className="hf-admin__error" role="alert">{error}</p> : <p className="hf-admin__empty" role="status">Cargando…</p>}
      </>
    )
  }

  const { bookings: bk, occupancy: occ, revenue: rev, visits, reviews, contacts, todo } = data
  const pendingCount = todo.bookings.length
  const sessionsToday = data.today.slots.filter((s) => s.kind === 'pending' || s.kind === 'confirmed').length
  const todoCount = todo.bookings.length + todo.reviews.length + todo.contacts.length

  const svcMax = Math.max(5, ...data.services.map((s) => s.count))
  const svcHover = data.services.find((s) => hover === `c-${s.label}`)
  const heatMax = Math.max(1, ...data.heat.flat())
  const heatHover = hover?.startsWith('l-') ? hover.split('-').map(Number) : null
  const peak = (() => {
    let best = { v: 0, r: 0, c: 0 }
    data.heat.forEach((row, r) => row.forEach((v, c) => v > best.v && (best = { v, r, c })))
    return best.v ? `Pico: ${WEEKDAYS[best.c].toLowerCase()} ${formatTime(timeSlots[best.r])}` : 'Sin reservas en el periodo'
  })()
  const revTotal = rev.paid + rev.due
  const litLeds = Math.round((bk.confirmedPct / 100) * LEDS)

  return (
    <>
      <title>Inicio · Panel</title>

      {/* ── Hoy primero (D2) ── */}
      <header className="hf-dash__hello">
        <span className="hf-dash__kick">{longDate(data.today.date)}</span>
        <h1 className="hf-dash__title">
          {greeting()}, <span>{shortName(admin)}.</span>
        </h1>
        <p className="hf-admin__lead">
          Hoy {sessionsToday === 1 ? 'hay 1 sesión' : `hay ${sessionsToday} sesiones`}
          {pendingCount > 0 && ` y ${pendingCount} ${pendingCount === 1 ? 'reserva espera' : 'reservas esperan'} confirmación`}.
        </p>
      </header>

      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-dash__top">
        <section className="hf-dash__card hf-dash__today" aria-labelledby="dash-today">
          <div className="hf-dash__card-head">
            <h2 id="dash-today" className="hf-dash__card-title">Hoy</h2>
            <Link to="/admin/reservas" className="hf-dash__link">Ver agenda →</Link>
          </div>
          <ol className="hf-dash__timeline">
            {data.today.slots.map((s) => (
              <TimelineRow key={s.time} slot={s} />
            ))}
          </ol>
          <div className="hf-dash__tomorrow">
            <span className="hf-dash__kick hf-dash__kick--muted">Mañana</span>
            {data.tomorrow.slots.length === 0 && <span className="hf-dash__muted">Sin sesiones.</span>}
            {data.tomorrow.slots.map((s) => (
              <span key={s.time}>
                <span className="hf-dash__gold">{formatTime(s.time)}</span> · {s.project} · {s.service}
              </span>
            ))}
          </div>
        </section>

        <section className="hf-dash__card hf-dash__todo" aria-labelledby="dash-todo">
          <h2 id="dash-todo" className="hf-dash__card-title">Espera tu respuesta</h2>
          {todoCount === 0 && <p className="hf-dash__muted">Todo en sintonía: nada pendiente.</p>}
          {todo.bookings.map((b) => (
            <div key={b.id} className="hf-dash__item">
              <div className="hf-dash__item-text">
                <span className="hf-dash__item-kind">Reserva</span>
                <span>{b.project} · {shortDate(b.date)}, {formatTime(b.time)}</span>
                <span className="hf-dash__muted">{b.service} · {b.rep}</span>
              </div>
              <div className="hf-dash__item-actions">
                <button
                  type="button"
                  className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm"
                  onClick={() => setCharge({ id: b.id, date: b.date, startTime: b.time, service: b.service, project: b.project })}
                >
                  Confirmar
                </button>
                <Link to="/admin/reservas" className="hf-admin__btn hf-admin__btn--sm">Ver</Link>
              </div>
            </div>
          ))}
          {todo.reviews.map((r) => (
            <div key={r.id} className="hf-dash__item">
              <div className="hf-dash__item-text">
                <span className="hf-dash__item-kind">Opinión</span>
                <span><span className="hf-dash__gold" aria-label={`${r.rating} de 5 estrellas`}>{'★'.repeat(r.rating)}</span> {r.name}</span>
                <span className="hf-dash__muted hf-dash__clip">“{r.text}”</span>
              </div>
              <div className="hf-dash__item-actions">
                <Link to="/admin/opiniones" className="hf-admin__btn hf-admin__btn--sm">Revisar</Link>
              </div>
            </div>
          ))}
          {todo.contacts.map((x) => (
            <div key={x.id} className="hf-dash__item">
              <div className="hf-dash__item-text">
                <span className="hf-dash__item-kind">Contacto</span>
                <span>{x.name} · {x.topic}</span>
                <span className="hf-dash__muted">{x.email} · {formatStamp(x.createdAt)}</span>
              </div>
              <div className="hf-dash__item-actions">
                <a href={`mailto:${x.email}?subject=${encodeURIComponent(`Hathor Frequency · ${x.topic}`)}`} className="hf-admin__btn hf-admin__btn--sm">
                  Responder
                </a>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* ── Master del periodo (D3) ── */}
      <div className="hf-dash__master-head">
        <div>
          <h2 className="hf-dash__master-title">Master <span>del periodo.</span></h2>
          <p className="hf-dash__muted">
            {shortDate(data.period.from)} – {shortDate(data.period.to)} · comparado con {shortDate(data.period.prevFrom)} – {shortDate(data.period.prevTo)}
          </p>
        </div>
        <div className="hf-dash__knob" role="radiogroup" aria-label="Periodo">
          {RANGES.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={range === r.value} onClick={() => setRange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hf-dash__meters">
        <section className="hf-dash__panel hf-dash__panel--center" aria-labelledby="m-occ">
          <h3 id="m-occ" className="hf-dash__ptitle">Ocupación</h3>
          <svg width="170" height="170" viewBox="0 0 170 170" role="img" aria-label={`Ocupación ${occ.pct} por ciento`}>
            <circle cx="85" cy="85" r="76" fill="none" stroke="#1c1c1c" strokeWidth="8" />
            <circle
              className="hf-dash__ring"
              cx="85"
              cy="85"
              r="76"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(Math.min(occ.pct, 100) / 100) * RING} ${RING}`}
              transform="rotate(-90 85 85)"
            />
            {[60, 48, 36].map((r) => (
              <circle key={r} cx="85" cy="85" r={r} fill="none" stroke={r === 60 ? '#222' : '#1a1a1a'} />
            ))}
            <text x="85" y="94" textAnchor="middle" className="hf-dash__ring-text">{occ.pct}%</text>
          </svg>
          <span className="hf-dash__muted">
            {occ.taken} de {occ.capacity} horarios · {delta(occ.pct - occ.prevPct, ' pts')}
          </span>
        </section>

        <section className="hf-dash__panel" aria-labelledby="m-res">
          <h3 id="m-res" className="hf-dash__ptitle">Reservas</h3>
          <span className="hf-dash__lcd hf-dash__lcd--xl">{bk.total}</span>
          <div className="hf-dash__vu" aria-hidden="true">
            {Array.from({ length: LEDS }, (_, i) => (
              <span key={i} className={i < litLeds ? 'is-on' : ''} />
            ))}
          </div>
          <dl className="hf-dash__dl">
            <dt>Confirmadas</dt><dd>{bk.confirmed} · {bk.confirmedPct}%</dd>
            <dt>Pendientes</dt><dd>{bk.pending}</dd>
            <dt>Canceladas</dt><dd>{bk.cancelled} · {bk.cancelledPct}%</dd>
          </dl>
          <span className="hf-dash__muted">{delta(bk.change)} vs. periodo anterior</span>
        </section>

        <section className="hf-dash__panel" aria-labelledby="m-rev">
          <h3 id="m-rev" className="hf-dash__ptitle">Ingresos · MXN</h3>
          <span className="hf-dash__lcd hf-dash__lcd--lg">{formatMoney(rev.paid)}</span>
          <span className="hf-dash__muted">cobrado · {delta(rev.change)}</span>
          <div className="hf-dash__split" role="img" aria-label={`Cobrado ${formatMoney(rev.paid)}, por cobrar ${formatMoney(rev.due)}`}>
            {revTotal > 0 ? (
              <>
                {rev.paid > 0 && <span className="hf-dash__paid" style={{ flex: rev.paid }} />}
                {rev.due > 0 && <span className="hf-dash__due" style={{ flex: rev.due }} />}
              </>
            ) : (
              <span className="hf-dash__empty-bar" />
            )}
          </div>
          <span className="hf-dash__muted">{formatMoney(rev.due)} por cobrar (trama)</span>
        </section>

        <section className="hf-dash__panel" aria-labelledby="m-vis">
          <h3 id="m-vis" className="hf-dash__ptitle">Visitas · Umami</h3>
          {visits ? (
            <>
              <span className="hf-dash__lcd hf-dash__lcd--xl">{visits.visitors.toLocaleString('en-US')}</span>
              <span className="hf-dash__muted">
                {delta(visits.change)} · conversión a reserva <span className="hf-dash__gold">{visits.conversion ?? 0}%</span>
              </span>
              <span className="hf-dash__muted">{visits.pageviews.toLocaleString('en-US')} páginas vistas</span>
            </>
          ) : (
            <>
              <span className="hf-dash__lcd hf-dash__lcd--xl hf-dash__lcd--off">—</span>
              <span className="hf-dash__muted">Sin datos de Umami. Revisa su configuración (README · Visitas).</span>
            </>
          )}
        </section>
      </div>

      <div className="hf-dash__charts">
        <section className="hf-dash__panel" aria-labelledby="m-ch">
          <div className="hf-dash__panel-head">
            <h3 id="m-ch" className="hf-dash__ptitle">Canales · reservas por servicio</h3>
            <span className="hf-dash__muted" aria-live="polite">
              {svcHover
                ? `${svcHover.label} · ${svcHover.count} ${svcHover.count === 1 ? 'reserva' : 'reservas'} · ${pct(svcHover.count, bk.total - bk.cancelled)}%`
                : `${bk.total - bk.cancelled} reservas activas`}
            </span>
          </div>
          <div className="hf-dash__channels">
            <div className="hf-dash__axis" aria-hidden="true">
              <span>{svcMax}</span>
              <span>{Math.round(svcMax / 2)}</span>
              <span>0</span>
            </div>
            {data.services.map((s) => (
              <button
                key={s.label}
                type="button"
                className="hf-dash__channel"
                aria-label={`${s.label}: ${s.count} reservas`}
                onMouseEnter={() => setHover(`c-${s.label}`)}
                onFocus={() => setHover(`c-${s.label}`)}
                onMouseLeave={clear}
                onBlur={clear}
              >
                <span>{s.count}</span>
                <span className="hf-dash__track">
                  <span className={`hf-dash__fill ${hover === `c-${s.label}` ? 'is-hot' : ''}`} style={{ height: `${(s.count / svcMax) * 100}%` }} />
                </span>
                <span className="hf-dash__channel-label">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="hf-dash__panel" aria-labelledby="m-led">
          <div className="hf-dash__panel-head">
            <h3 id="m-led" className="hf-dash__ptitle">Matriz · cuándo reservan</h3>
            <span className="hf-dash__muted" aria-live="polite">
              {heatHover
                ? `${WEEKDAYS[heatHover[2]]} ${formatTime(timeSlots[heatHover[1]])} · ${data.heat[heatHover[1]][heatHover[2]]} reservas`
                : peak}
            </span>
          </div>
          <div className="hf-dash__matrix">
            <span />
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} className="hf-dash__wd">{w}</span>
            ))}
            {timeSlots.map((t, r) => (
              <div key={t} className="hf-dash__matrix-row">
                <span className="hf-dash__matrix-time">{formatTime(t)}</span>
                {data.heat[r].map((v, c) => {
                  const level = v === 0 ? 0 : Math.ceil((v / heatMax) * 4)
                  const key = `l-${r}-${c}`
                  return (
                    <button
                      key={c}
                      type="button"
                      className="hf-dash__led-cell"
                      aria-label={`${WEEKDAYS[c]} ${formatTime(t)}: ${v} reservas`}
                      onMouseEnter={() => setHover(key)}
                      onFocus={() => setHover(key)}
                      onMouseLeave={clear}
                      onBlur={clear}
                    >
                      <span className={`hf-dash__led hf-dash__led--${level} ${hover === key ? 'is-hot' : ''}`} />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <span className="hf-dash__note">El tamaño y el brillo del LED crecen con las reservas.</span>
        </section>
      </div>

      <div className="hf-dash__charts">
        <section className="hf-dash__panel" aria-labelledby="m-fun">
          <h3 id="m-fun" className="hf-dash__ptitle">De la visita a la reserva</h3>
          {visits ? (
            <div className="hf-dash__funnel">
              {[
                ['Visitantes', visits.visitors],
                ['Vieron Reservar', visits.bookingViews],
                ['Enviaron reserva', visits.bookings],
              ].map(([label, n]) => (
                <div key={label} className="hf-dash__funnel-row">
                  <span className="hf-dash__muted">{label}</span>
                  <span className="hf-dash__bar-track">
                    <span className="hf-dash__bar" style={{ width: `${visits.visitors ? (Number(n) / visits.visitors) * 100 : 0}%` }} />
                  </span>
                  <span>{Number(n).toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="hf-dash__muted">Se llena cuando Umami esté conectado. Solicitudes recibidas en el periodo: {bk.total}.</p>
          )}
        </section>

        <section className="hf-dash__panel" aria-labelledby="m-op">
          <h3 id="m-op" className="hf-dash__ptitle">Opiniones y contactos</h3>
          <div className="hf-dash__op">
            <div className="hf-dash__rating">
              <span className="hf-dash__lcd hf-dash__lcd--xl">{reviews.average ?? '—'}</span>
              {reviews.average !== null && <span className="hf-dash__gold" aria-label={`${reviews.average} de 5 estrellas`}>★★★★★</span>}
              <span className="hf-dash__muted">{reviews.count} publicadas</span>
            </div>
            <dl className="hf-dash__facts">
              <div><dt>Contactos</dt><dd>{contacts.count}</dd></div>
              <div><dt>Tema más pedido</dt><dd>{contacts.topTopic ? `${contacts.topTopic.label} · ${contacts.topTopic.count}` : '—'}</dd></div>
              <div><dt>Tiempo en atender</dt><dd className="hf-dash__gold">{contacts.avgHours !== null ? `${contacts.avgHours} h` : '—'}</dd></div>
              <div><dt>Sin atender</dt><dd>{contacts.open}</dd></div>
            </dl>
          </div>
        </section>
      </div>

      {charge && (
        <ChargeModal
          booking={charge}
          mode="confirm"
          onClose={() => setCharge(null)}
          onError={onError}
          onSaved={() => {
            setCharge(null)
            reload()
            refreshSummary()
          }}
        />
      )}
    </>
  )
}

/** Fila de la línea de tiempo de hoy: hora, punto según el estado y qué hay */
function TimelineRow({ slot }: { slot: DaySlot }) {
  const title =
    slot.kind === 'free' ? 'Libre' : slot.kind === 'blocked' ? (slot.reason ?? 'Bloqueado') : slot.project
  const sub =
    slot.kind === 'pending' ? `${slot.service} · por confirmar` : slot.kind === 'confirmed' ? `${slot.service} · confirmada` : ''
  return (
    <li className={`hf-dash__tl is-${slot.kind}`}>
      <span className="hf-dash__tl-time">{formatTime(slot.time)}</span>
      <span className="hf-dash__tl-rail" aria-hidden="true">
        <span className="hf-dash__tl-dot" />
        <span className="hf-dash__tl-line" />
      </span>
      <span className="hf-dash__tl-body">
        <span className="hf-dash__tl-title">{title}</span>
        {sub && <span className="hf-dash__muted">{sub}</span>}
      </span>
    </li>
  )
}
