import { useId, type FormEvent } from 'react'
import { bookingServices, representativeTypes, timeSlots } from '../../data/booking'
import { dayLabel } from '../../lib/calendar'
import type { BookingContact } from '../../lib/submit'
import { Button } from '../shared/Button'
import { VinylRings } from '../shared/VinylRings'

export type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error'

interface SessionPanelProps {
  date: Date
  slot: number
  service: string
  contact: BookingContact
  status: SubmitStatus
  onSlot: (i: number) => void
  onService: (s: string) => void
  onContact: (patch: Partial<BookingContact>) => void
  onSubmit: () => void
}

/** Diseño RA (canvas https://claude.ai/artifact/VuPzsH4vpZaQc3XDpAXBzL): sesión y datos de contacto en el mismo panel */
export function SessionPanel({ date, slot, service, contact, status, onSlot, onService, onContact, onSubmit }: SessionPanelProps) {
  const id = useId()
  const rep = representativeTypes.find((r) => r.value === contact.representativeType) ?? representativeTypes[0]

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
          <label htmlFor={`${id}-service`} className="hf-label">Servicio</label>
          <select id={`${id}-service`} className="hf-select" value={service} onChange={(e) => onService(e.target.value)}>
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

        {/* Datos de contacto */}
        <div className="hf-session__section">
          <span className="hf-session__kicker">Tus datos</span>
          <span className="hf-session__hint">Para confirmar la sesión y darte seguimiento.</span>
        </div>

        <div className="hf-session__field">
          <label htmlFor={`${id}-project`} className="hf-label">Banda o proyecto</label>
          <input
            id={`${id}-project`}
            className="hf-input"
            type="text"
            autoComplete="organization"
            placeholder="Nombre de la banda o proyecto"
            required
            maxLength={120}
            value={contact.project}
            onChange={(e) => onContact({ project: e.target.value })}
          />
        </div>

        <fieldset className="hf-session__field">
          <legend className="hf-label hf-session__legend">Representante</legend>
          <div className="hf-session__reps" role="group" aria-label="El representante es">
            {representativeTypes.map((r) => (
              <button
                key={r.value}
                type="button"
                className="hf-slot"
                aria-pressed={r.value === contact.representativeType}
                onClick={() => onContact({ representativeType: r.value })}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-rep`} className="sr-only">Nombre del representante</label>
          <input
            id={`${id}-rep`}
            className="hf-input"
            type="text"
            autoComplete="name"
            placeholder={rep.placeholder}
            required
            maxLength={120}
            aria-describedby={`${id}-rep-help`}
            value={contact.representativeName}
            onChange={(e) => onContact({ representativeName: e.target.value })}
          />
          <span id={`${id}-rep-help`} className="hf-session__help">{rep.help}</span>
        </fieldset>

        <div className="hf-session__field">
          <label htmlFor={`${id}-phone`} className="hf-label">Número de contacto</label>
          <input
            id={`${id}-phone`}
            className="hf-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+52 55 0000 0000"
            required
            pattern="[0-9+()\s\-]{8,20}"
            title="Escribe un número de al menos 8 dígitos"
            value={contact.phone}
            onChange={(e) => onContact({ phone: e.target.value })}
          />
        </div>

        <div className="hf-session__field">
          <label htmlFor={`${id}-email`} className="hf-label">Correo</label>
          <input
            id={`${id}-email`}
            className="hf-input"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            maxLength={254}
            value={contact.email}
            onChange={(e) => onContact({ email: e.target.value })}
          />
        </div>

        <div className="hf-session__submit">
          <Button type="submit" variant="primary" block disabled={status === 'sending'}>
            {status === 'sending' ? 'Enviando…' : `Reservar ${timeSlots[slot]} h`}
          </Button>
          <p className="hf-session__status" role="status">
            {status === 'error' && 'No pudimos enviar tu reserva. Intenta de nuevo.'}
          </p>
        </div>
      </form>
    </aside>
  )
}
