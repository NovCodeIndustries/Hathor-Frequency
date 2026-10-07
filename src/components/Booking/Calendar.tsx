import {
  WEEKDAYS_MIN,
  WEEKDAYS_SHORT,
  dayLabel,
  monthCells,
  monthTitle,
  sameDay,
  type YearMonth,
} from '../../lib/calendar'

interface CalendarProps {
  month: YearMonth
  selected: Date
  today: Date
  canGoPrev: boolean
  onPrev: () => void
  onNext: () => void
  onSelect: (d: Date) => void
}

export function Calendar({ month, selected, today, canGoPrev, onPrev, onNext, onSelect }: CalendarProps) {
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
          return (
            <button
              key={d.getDate()}
              type="button"
              className="hf-cal__day"
              aria-pressed={isSel}
              aria-label={dayLabel(d)}
              disabled={isPast}
              onClick={() => onSelect(d)}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
