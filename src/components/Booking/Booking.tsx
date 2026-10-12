import { useCallback, useState } from 'react'
import { bookingServices, defaultSlot } from '../../data/booking'
import { addMonths, compareMonths, dayLabel, startOfDay, toISODate, type YearMonth } from '../../lib/calendar'
import { SubmitError, submitBooking, submitErrorText, type BookingContact } from '../../lib/submit'
import { useAvailability } from '../../lib/useAvailability'
import { trackEvent } from '../../lib/analytics'
import { useContent } from '../../lib/content'
import { formatTime } from '../../lib/time'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { BookingModal } from './BookingModal'
import { Calendar } from './Calendar'
import { RockAlien } from './RockAlien'
import { RockAlienMini } from './RockAlienMini'
import { SessionPanel, type SubmitStatus } from './SessionPanel'
import './Booking.css'
import { Module } from '../shared/Module'

const EMPTY_CONTACT: BookingContact = {
  project: '',
  representativeType: 'integrante',
  representativeName: '',
  phone: '',
  email: '',
}

const trimmed = (c: BookingContact): BookingContact => ({
  ...c,
  project: c.project.trim(),
  representativeName: c.representativeName.trim(),
  phone: c.phone.trim(),
  email: c.email.trim(),
})

export function Booking() {
  const [today] = useState(() => startOfDay(new Date()))
  const currentMonth: YearMonth = { year: today.getFullYear(), month: today.getMonth() }

  const [month, setMonth] = useState<YearMonth>(currentMonth)
  const [selected, setSelected] = useState<Date>(today)
  const timeSlots = useContent('horarios').slots
  // Se guarda la hora (no el índice) para que siga elegida si el estudio cambia las horas
  const [slotTime, setSlotTime] = useState(defaultSlot)
  const [service, setService] = useState<string>(bookingServices[0])
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [contact, setContact] = useState<BookingContact>(EMPTY_CONTACT)
  // Copia de lo enviado para el resumen del modal
  const [sent, setSent] = useState<{ session: string; project: string; contact: string } | null>(null)
  const [error, setError] = useState('')

  const { availability, refresh } = useAvailability(month)
  const selectedISO = toISODate(selected)
  const blockedDays = new Set(availability.blockedDays)
  const takenSlots = blockedDays.has(selectedISO) ? [...timeSlots] : (availability.taken[selectedISO] ?? [])
  // Si el horario elegido se ocupó, se quitó o el día se cerró, se usa el primero libre
  const chosen = timeSlots.indexOf(slotTime)
  const activeSlot = chosen >= 0 && !takenSlots.includes(slotTime)
    ? chosen
    : Math.max(0, timeSlots.findIndex((t) => !takenSlots.includes(t)))

  const touch = () => status !== 'sending' && setStatus('idle')

  const handleSubmit = async (website?: string) => {
    setStatus('sending')
    try {
      const data = { date: selectedISO, time: timeSlots[activeSlot], service, ...trimmed(contact), website }
      await submitBooking(data)
      trackEvent('reserva-enviada', { servicio: service })
      setStatus('sent')
      setSent({
        session: `${dayLabel(selected)} · ${formatTime(data.time)} · ${service}`,
        project: data.project,
        contact: `${data.representativeName} (${data.representativeType}) · ${data.phone}`,
      })
      setContact(EMPTY_CONTACT)
      refresh()
    } catch (err) {
      setError(submitErrorText(err, 'No pudimos enviar tu reserva. Intenta de nuevo.'))
      setStatus('error')
      // 409: el horario se ocupó mientras llenaba el formulario
      if (err instanceof SubmitError && err.status === 409) refresh()
    }
  }

  const closeModal = useCallback(() => {
    setSent(null)
    setStatus('idle')
  }, [])

  return (
    <section id="reservar" className="hf-booking hf-container" aria-labelledby="reservar-title">
      <div className="hf-booking__main">
        <div className="hf-booking__title">
          <Eyebrow>Reservar</Eyebrow>
          <h1 id="reservar-title" className="hf-h2">
            Elige el día <GoldText>que vas a grabar.</GoldText>
          </h1>
        </div>
        <Calendar
          month={month}
          selected={selected}
          today={today}
          blockedDays={blockedDays}
          canGoPrev={compareMonths(month, currentMonth) > 0}
          onPrev={() => setMonth((m) => addMonths(m, -1))}
          onNext={() => setMonth((m) => addMonths(m, 1))}
          onSelect={(d) => {
            setSelected(d)
            touch()
          }}
        />
        <Module id="global.eggs">
          <RockAlien />
          <RockAlienMini />
        </Module>
      </div>

      <SessionPanel
        date={selected}
        slots={timeSlots}
        slot={activeSlot}
        takenSlots={takenSlots}
        error={error}
        service={service}
        contact={contact}
        status={status}
        onSlot={(i) => {
          setSlotTime(timeSlots[i])
          touch()
        }}
        onService={(s) => {
          setService(s)
          touch()
        }}
        onContact={(patch) => {
          setContact((c) => ({ ...c, ...patch }))
          touch()
        }}
        onSubmit={handleSubmit}
      />

      {sent && <BookingModal {...sent} onClose={closeModal} />}
    </section>
  )
}
