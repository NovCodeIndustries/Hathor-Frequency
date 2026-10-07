import { useId, type FormEvent } from 'react'
import { bookingServices, responseNote, timeSlots } from '../../data/booking'
import { dayLabel } from '../../lib/calendar'
import { Button } from '../shared/Button'
import { VinylRings } from '../shared/VinylRings'

export type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error'

interface SessionPanelProps {
  date: Date
  slot: number
  service: string
  status: SubmitStatus
  onSlot: (i: number) => void
  onService: (s: string) => void
  onSubmit: () => void
}

export function SessionPanel({ date, slot, service, status, onSlot, onService, onSubmit }: SessionPanelProps) {
  const selectId = useId()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <aside className="hf-session" aria-label="Detalle de la sesión">
      <VinylRings
        className="hf-session__rings"
        size={360}
        radii={[175, 145, 115, 85]}
        strokeOpacity={1}
        center={{ r: 30, opacity: 0.3 }}
      />
      <form className="hf-session__form" onSubmit={handleSubmit}>
        <div className="hf-session__date">
          <span className="hf-session__kicker">Tu sesión</span>
          <span className="hf-session__day" aria-live="polite">{dayLabel(date)}</span>
        </div>

        <div className="hf-session__field">
          <label htmlFor={selectId} className="hf-label">Servicio</label>
          <select id={selectId} className="hf-select" value={service} onChange={(e) => onService(e.target.value)}>
            {bookingServices.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <fieldset className="hf-session__slots">
          <legend className="hf-label">Hora de inicio</legend>
          <div className="hf-session__grid">
            {timeSlots.map((t, i) => (
              <button key={t} type="button" className="hf-slot" aria-pressed={i === slot} onClick={() => onSlot(i)}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="hf-session__note">{responseNote}</p>

        <div className="hf-session__submit">
          <Button type="submit" variant="primary" block disabled={status === 'sending'}>
            {status === 'sending' ? 'Enviando…' : `Reservar ${timeSlots[slot]} h`}
          </Button>
          <p className="hf-session__status" role="status">
            {status === 'sent' && `Recibido: ${dayLabel(date)}, ${timeSlots[slot]} h. Te escribimos pronto.`}
            {status === 'error' && 'No pudimos enviar tu reserva. Intenta de nuevo.'}
          </p>
        </div>
      </form>
    </aside>
  )
}
