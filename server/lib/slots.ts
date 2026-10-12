import { maxSlots, sortSlots, timePattern, timeSlots } from '../../src/data/booking'
import { prisma } from '../db'

/** Horas de inicio publicadas (panel · Contenido · Horarios) o las iniciales de `src/data/booking.ts` */
export async function bookingSlots(): Promise<string[]> {
  const v = await prisma.contentVersion.findFirst({ where: { key: 'horarios' }, orderBy: { publishedAt: 'desc' }, select: { data: true } })
  const raw = (v?.data as { slots?: unknown } | undefined)?.slots
  const slots = Array.isArray(raw) ? raw.filter((t): t is string => typeof t === 'string' && timePattern.test(t)) : []
  return slots.length ? sortSlots(slots).slice(0, maxSlots) : [...timeSlots]
}
