import { prisma } from '../db'
import { timeSlots } from '../../src/data/booking'
import { BookingStatus } from '../generated/prisma/enums'
import { isoFromDate } from './dates'

/** Estados que ocupan un horario (CANCELLED lo libera) */
export const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED]

export interface Availability {
  /** Horarios ocupados por día (reservas activas + bloqueos por horario) */
  taken: Record<string, string[]>
  /** Días cerrados completos o sin ningún horario libre */
  blockedDays: string[]
}

/** Disponibilidad entre `from` (incluido) y `to` (excluido); sin datos personales */
export async function availabilityBetween(from: Date, to: Date): Promise<Availability> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { date: { gte: from, lt: to }, status: { in: ACTIVE_STATUSES } },
      select: { date: true, startTime: true },
    }),
    prisma.blockedSlot.findMany({ where: { date: { gte: from, lt: to } }, select: { date: true, startTime: true } }),
  ])

  const taken: Record<string, Set<string>> = {}
  const closed = new Set<string>()
  for (const b of [...bookings, ...blocks]) {
    const day = isoFromDate(b.date)
    if (b.startTime === null) closed.add(day)
    else (taken[day] ??= new Set()).add(b.startTime)
  }
  for (const [day, set] of Object.entries(taken)) if (set.size >= timeSlots.length) closed.add(day)

  return {
    taken: Object.fromEntries(Object.entries(taken).map(([d, s]) => [d, timeSlots.filter((t) => s.has(t))])),
    blockedDays: [...closed].sort(),
  }
}

/** ¿El estudio cerró ese horario (o el día completo)? */
export async function isBlocked(date: Date, startTime: string): Promise<boolean> {
  const block = await prisma.blockedSlot.findFirst({
    where: { date, OR: [{ startTime: null }, { startTime }] },
    select: { id: true },
  })
  return !!block
}
