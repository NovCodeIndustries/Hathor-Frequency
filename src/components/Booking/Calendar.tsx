import { useSeason } from '../../lib/useSeason'
import { Glyph } from '../Ufo/seasonArt'
import {
  WEEKDAYS_MIN,
  WEEKDAYS_SHORT,
  dayLabel,
  monthCells,
  monthTitle,
  sameDay,
  toISODate,
  type YearMonth,
} from '../../lib/calendar'

interface CalendarProps {
  month: YearMonth
  selected: Date
  today: Date
  /** Días "YYYY-MM-DD" cerrados o sin horarios libres (API de disponibilidad) */
  blockedDays: Set<string>
  canGoPrev: boolean
  onPrev: () => void
  onNext: () => void
  onSelect: (d: Date) => void
}

export function Calendar({ month, selected, today, blockedDays, canGoPrev, onPrev, onNext, onSelect }: CalendarProps) {
  const season = useSeason()
  const cells = monthCells(month)

  return (
    <div className="hf-cal">
      <div className="hf-cal__nav">
        <button type="button" className="hf-cal__arrow" aria-label="Mes anterior" onClick={onPrev} disabled={!canGoPrev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <span className="hf-cal__title" aria-live="polite">{monthTitle(month)}</span>
        <button type="button" className="hf-cal__arrow" aria-label="Mes siguiente" onClick={onNext}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      </div>

      <div className="hf-cal__week" aria-hidden="true">
        {WEEKDAYS_SHORT.map((w, i) => (
          <span key={w}>
            <span className="hf-cal__wd-long">{w}</span>
            <span className="hf-cal__wd-short">{WEEKDAYS_MIN[i]}</span>
          </span>
        ))}
      </div>

      <div className="hf-cal__days">
        {cells.map((d, i) => {
          if (!d) return <span key={`blank-${i}`} />
          const isSel = sameDay(d, selected)
          const isPast = d < today
          const isFull = !isPast && blockedDays.has(toISODate(d))
          // Día de la temporada (solo visual: no aparta ni bloquea nada)
          const isSeason =
            !!season &&
            d.getMonth() === (season.date?.month ?? season.month) &&
            d.getDate() === (season.date?.day ?? season.day.day)
          return (
            <button
              key={d.getDate()}
              type="button"
              className={`hf-cal__day ${isSeason ? 'is-season' : ''} ${isFull ? 'is-full' : ''}`}
              aria-pressed={isSel}
              aria-label={`${dayLabel(d)}${isSeason ? ` · ${season.day.tip}` : ''}${isFull ? ' · sin horarios' : ''}`}
              title={isSeason ? season.day.tip : undefined}
              disabled={isPast || isFull}
              onClick={() => onSelect(d)}
            >
              {d.getDate()}
              {isSeason && (
                <span className="hf-cal__season" aria-hidden="true">
                  <Glyph name={season.day.glyph} size={16} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
