import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { bookingServices, representativeTypes } from '../../data/booking'
import { adminApi, dateFromISO, type AdminBooking, type NewBooking } from '../../lib/adminApi'
import { toISODate } from '../../lib/calendar'
import { useContent } from '../../lib/content'
import { formatTime } from '../../lib/time'
import { useAvailability } from '../../lib/useAvailability'
import './ChargeModal.css'

interface NewBookingModalProps {
  /** Día y hora propuestos ("YYYY-MM-DD", "15:00"); la hora puede venir vacía */
  date: string
  time?: string
  onClose: () => void
  onSaved: (b: AdminBooking) => void
  onError: (err: unknown) => string
}

/**
 * Agendar una sesión desde el panel (llamada, WhatsApp, en persona) sin pasar por la web.
 * Usa el mismo marco que la ventana de cobro (M2). Por defecto queda confirmada; el cobro se captura después.
 */
export function NewBookingModal({ date: initialDate, time: initialTime, onClose, onSaved, onError }: NewBookingModalProps) {
  const id = useId()
  const projectRef = useRef<HTMLInputElement>(null)
  const slots = useContent('horarios').slots
  const [today] = useState(() => toISODate(new Date()))

  const [date, setDate] = useState(initialDate < today ? today : initialDate)
  const [time, setTime] = useState(initialTime ?? '')
  const [form, setForm] = useState<Omit<NewBooking, 'date' | 'time'>>({
    service: bookingServices[0],
    project: '',
    representativeType: 'integrante',
    representativeName: '',
    phone: '',
    email: '',
    status: 'CONFIRMED',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const d = dateFromISO(date)
  const { availability } = useAvailability({ year: d.getFullYear(), month: d.getMonth() })
  const closed = availability.blockedDays.includes(date)
  const taken = closed ? slots : (availability.taken[date] ?? [])
  const free = slots.filter((t) => !taken.includes(t))
  // Si la hora elegida se ocupó (o el día cambió), se propone la primera libre
  const chosen = time && free.includes(time) ? time : (free[0] ?? '')

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    projectRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  const rep = representativeTypes.find((r) => r.value === form.representativeType) ?? representativeTypes[0]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!chosen) return setError('Ese día no tiene horarios libres.')
    if (!form.project.trim() || !form.representativeName.trim() || !form.phone.trim()) return setError('Faltan el proyecto, el nombre o el teléfono.')
    setSaving(true)
    setError('')
    try {
      const saved = await adminApi.createBooking({
        ...form,
        project: form.project.trim(),
        representativeName: form.representativeName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        date,
        time: chosen,
      })
      onSaved(saved)
    } catch (err) {
      setError(onError(err))
      setSaving(false)
    }
  }

  return createPortal(
    <div className="hf-charge">
      <button type="button" className="hf-charge__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <form className="hf-charge__card hf-newbook" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit} noValidate>
        <div className="hf-charge__head">
          <div>
            <h2 id={`${id}-title`} className="hf-charge__title">
              Agendar <span>sesión</span>
            </h2>
            <p className="hf-charge__sub">Para reservas por llamada, WhatsApp o en persona.</p>
          </div>
          <button type="button" className="hf-charge__close" aria-label="Cerrar" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>

        <div className="hf-newbook__row">
          <label className="hf-admin__field" htmlFor={`${id}-date`}>
            Día
            <input id={`${id}-date`} className="hf-admin__input hf-newbook__date" type="date" min={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-service`}>
            Servicio
            <select id={`${id}-service`} className="hf-admin__input" value={form.service} onChange={(e) => set({ service: e.target.value })}>
              {bookingServices.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="hf-charge__pay">
          <legend>Hora de inicio</legend>
          {free.length ? (
            <div className="hf-newbook__slots">
              {slots.map((t) => (
                <button key={t} type="button" className="hf-admin__filter" aria-pressed={t === chosen} disabled={taken.includes(t)} aria-label={taken.includes(t) ? `${formatTime(t)} · ocupado` : undefined} onClick={() => setTime(t)}>
                  {formatTime(t)}
                </button>
              ))}
            </div>
          ) : (
            <p className="hf-charge__hint">{closed ? 'El día está cerrado o lleno. Elige otro o ábrelo en la agenda.' : 'Sin horarios libres este día.'}</p>
          )}
        </fieldset>

        <label className="hf-admin__field" htmlFor={`${id}-project`}>
          Banda o proyecto
          <input ref={projectRef} id={`${id}-project`} className="hf-admin__input" maxLength={120} value={form.project} onChange={(e) => set({ project: e.target.value })} />
        </label>

        <fieldset className="hf-charge__pay">
          <legend>Representante</legend>
          <div className="hf-newbook__two">
            {representativeTypes.map((r) => (
              <button key={r.value} type="button" className="hf-admin__filter" aria-pressed={form.representativeType === r.value} onClick={() => set({ representativeType: r.value as NewBooking['representativeType'] })}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="hf-admin__field" htmlFor={`${id}-rep`}>
          Nombre
          <input id={`${id}-rep`} className="hf-admin__input" maxLength={120} placeholder={rep.placeholder} value={form.representativeName} onChange={(e) => set({ representativeName: e.target.value })} />
        </label>

        <div className="hf-newbook__row">
          <label className="hf-admin__field" htmlFor={`${id}-phone`}>
            Teléfono
            <input id={`${id}-phone`} className="hf-admin__input" type="tel" inputMode="tel" maxLength={20} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-email`}>
            Correo · opcional
            <input id={`${id}-email`} className="hf-admin__input" type="email" maxLength={254} value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </label>
        </div>

        <fieldset className="hf-charge__pay">
          <legend>Estado</legend>
          <div className="hf-newbook__two">
            <button type="button" className="hf-admin__filter" aria-pressed={form.status === 'CONFIRMED'} onClick={() => set({ status: 'CONFIRMED' })}>Confirmada</button>
            <button type="button" className="hf-admin__filter" aria-pressed={form.status === 'PENDING'} onClick={() => set({ status: 'PENDING' })}>Por confirmar</button>
          </div>
        </fieldset>

        <p className="hf-admin__error" role="status">{error}</p>

        <div className="hf-charge__actions">
          <button type="button" className="hf-admin__btn" onClick={onClose}>Volver</button>
          <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-charge__submit" disabled={saving || !chosen}>
            {saving ? 'Guardando…' : chosen ? `Agendar · ${formatTime(chosen)}` : 'Sin horario libre'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
