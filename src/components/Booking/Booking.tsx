import { useCallback, useState } from 'react'
import { bookingServices, defaultSlotIndex, timeSlots } from '../../data/booking'
import { addMonths, compareMonths, dayLabel, startOfDay, toISODate, type YearMonth } from '../../lib/calendar'
import { submitBooking, type BookingContact } from '../../lib/submit'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { BookingModal } from './BookingModal'
import { Calendar } from './Calendar'
import { RockAlien } from './RockAlien'
import { RockAlienMini } from './RockAlienMini'
import { SessionPanel, type SubmitStatus } from './SessionPanel'
import './Booking.css'

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
  const [slot, setSlot] = useState(defaultSlotIndex)
  const [service, setService] = useState<string>(bookingServices[0])
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [contact, setContact] = useState<BookingContact>(EMPTY_CONTACT)
  // Copia de lo enviado para el resumen del modal
  const [sent, setSent] = useState<{ session: string; project: string; contact: string } | null>(null)

  const touch = () => status !== 'sending' && setStatus('idle')

  const handleSubmit = async () => {
    setStatus('sending')
    try {
      const data = { date: toISODate(selected), time: timeSlots[slot], service, ...trimmed(contact) }
      await submitBooking(data)
      setStatus('sent')
      setSent({
        session: `${dayLabel(selected)} · ${data.time} h · ${service}`,
        project: data.project,
        contact: `${data.representativeName} (${data.representativeType}) · ${data.phone}`,
      })
      setContact(EMPTY_CONTACT)
    } catch {
      setStatus('error')
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
          canGoPrev={compareMonths(month, currentMonth) > 0}
          onPrev={() => setMonth((m) => addMonths(m, -1))}
          onNext={() => setMonth((m) => addMonths(m, 1))}
          onSelect={(d) => {
            setSelected(d)
            touch()
          }}
        />
        <RockAlien />
        <RockAlienMini />
      </div>

      <SessionPanel
        date={selected}
        slot={slot}
        service={service}
        contact={contact}
        status={status}
        onSlot={(i) => {
          setSlot(i)
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
