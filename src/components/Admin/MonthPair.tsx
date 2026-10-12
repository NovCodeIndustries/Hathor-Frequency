import { MONTHS, WEEKDAYS_SHORT, addMonths, dayLabel, monthCells, monthTitle, toISODate, type YearMonth } from '../../lib/calendar'
import './MonthPair.css'

export type DayMark = 'pending' | 'done' | 'finished'

export interface DayInfo {
  /** Día cerrado completo (trama) */
  closed?: boolean
  /** Algún horario bloqueado (punto dorado abajo) */
  partial?: boolean
  /** Reservas del día, una marca por reserva */
  marks?: DayMark[]
  /** Texto extra para lectores de pantalla */
  label?: string
}

interface MonthPairProps {
  /** Primer mes mostrado; se ve también el siguiente */
  start: YearMonth
  today: Date
  /** Día elegido, "YYYY-MM-DD" */
  selected: string
  onSelect: (d: Date) => void
  onShift: (delta: number) => void
  canPrev: boolean
  /** Desactivar días pasados (Bloqueos); en Reservas se pueden ver */
  disablePast?: boolean
  dayInfo: (iso: string) => DayInfo
}

const MARK_LABEL: Record<DayMark, string> = { pending: 'pendiente', done: 'confirmada', finished: 'terminada' }

/** Dos meses en pantalla (el actual y el siguiente), uno debajo del otro, en Reservas y Bloqueos */
export function MonthPair({ start, today, selected, onSelect, onShift, canPrev, disablePast = false, dayInfo }: MonthPairProps) {
  const months = [start, addMonths(start, 1)]
  const range = `${MONTHS[start.month]} – ${monthTitle(months[1]).toLowerCase()}`
  return (
    <section className="hf-mpair" aria-label={`Calendario: ${range}`}>
      <div className="hf-mpair__nav">
        <button type="button" className="hf-admin__arrow" aria-label="Mes anterior" disabled={!canPrev} onClick={() => onShift(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
        </button>
        <span className="hf-mpair__range" aria-live="polite">{range}</span>
        <button type="button" className="hf-admin__arrow" aria-label="Mes siguiente" onClick={() => onShift(1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
        </button>
      </div>
      <div className="hf-mpair__months">
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`} className="hf-mpair__month">
            <span className="hf-mpair__title">{monthTitle(m)}</span>
            <div className="hf-mpair__week" aria-hidden="true">
              {WEEKDAYS_SHORT.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="hf-mpair__days">
              {monthCells(m).map((d, i) => {
                if (!d) return <span key={`b-${i}`} />
                const iso = toISODate(d)
                const info = dayInfo(iso)
                const past = d < today
                const marks = info.marks ?? []
                const extra = [
                  info.closed ? 'cerrado' : info.partial ? 'horarios bloqueados' : '',
                  marks.length ? `${marks.length} ${marks.length === 1 ? 'reserva' : 'reservas'} (${marks.map((x) => MARK_LABEL[x]).join(', ')})` : '',
                  info.label ?? '',
                ]
                  .filter(Boolean)
                  .join(', ')
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`hf-mpair__day ${info.closed ? 'is-closed' : ''} ${past ? 'is-past' : ''} ${d.getTime() === today.getTime() ? 'is-today' : ''}`}
                    aria-pressed={iso === selected}
                    aria-label={`${dayLabel(d)}${extra ? `, ${extra}` : ''}`}
                    disabled={disablePast && past}
                    onClick={() => onSelect(d)}
                  >
                    <span>{d.getDate()}</span>
                    {(marks.length > 0 || info.partial) && (
                      <span className="hf-mpair__marks" aria-hidden="true">
                        {marks.slice(0, 3).map((x, k) => (
                          <i key={k} className={`hf-mpair__mark hf-mpair__mark--${x}`} />
                        ))}
                        {marks.length > 3 && <b>+{marks.length - 3}</b>}
                        {info.partial && !info.closed && marks.length === 0 && <i className="hf-mpair__mark hf-mpair__mark--block" />}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
