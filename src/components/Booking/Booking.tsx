import { useState } from 'react'
import { bookingServices, defaultSlotIndex, timeSlots } from '../../data/booking'
import { addMonths, compareMonths, startOfDay, toISODate, type YearMonth } from '../../lib/calendar'
import { submitBooking } from '../../lib/submit'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { Calendar } from './Calendar'
import { SessionPanel, type SubmitStatus } from './SessionPanel'
import './Booking.css'

export function Booking() {
  const [today] = useState(() => startOfDay(new Date()))
  const currentMonth: YearMonth = { year: today.getFullYear(), month: today.getMonth() }

  const [month, setMonth] = useState<YearMonth>(currentMonth)
  const [selected, setSelected] = useState<Date>(today)
  const [slot, setSlot] = useState(defaultSlotIndex)
  const [service, setService] = useState<string>(bookingServices[0])
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const touch = () => status !== 'sending' && setStatus('idle')

  const handleSubmit = async () => {
    setStatus('sending')
    try {
      await submitBooking({ date: toISODate(selected), time: timeSlots[slot], service })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

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
      </div>

      <SessionPanel
        date={selected}
        slot={slot}
        service={service}
        status={status}
        onSlot={(i) => {
          setSlot(i)
          touch()
        }}
        onService={(s) => {
          setService(s)
          touch()
        }}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
