import { Hono } from 'hono'
import { z } from 'zod'
import { bookingServices, sortSlots } from '../../../src/data/booking'
import type { AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { BookingStatus, ReviewStatus } from '../../generated/prisma/enums'
import { dateFromISO, isoFromDate, todayISO } from '../../shared/lib/dates'
import { invalid } from '../../shared/lib/errors'
import { serviceLabel } from '../../shared/lib/services'
import { bookingSlots } from '../../shared/lib/slots'
import { visitsBetween } from '../lib/umami'

export const dashboard = new Hono<{ Variables: AdminVariables }>()

type Range = 'week' | 'month' | 'quarter' | 'year'

const addDays = (iso: string, n: number) => {
  const d = dateFromISO(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return isoFromDate(d)
}
const ymd = (y: number, m: number, d: number) => isoFromDate(new Date(Date.UTC(y, m, d)))

/** Periodo actual y el anterior de la misma duración, como "YYYY-MM-DD" (fin incluido) */
function periods(range: Range, today: string) {
  const t = dateFromISO(today)
  const y = t.getUTCFullYear()
  const m = t.getUTCMonth()
  if (range === 'week') {
    const from = addDays(today, -((t.getUTCDay() + 6) % 7))
    return { from, to: addDays(from, 6), prevFrom: addDays(from, -7), prevTo: addDays(from, -1) }
  }
  if (range === 'month') return { from: ymd(y, m, 1), to: ymd(y, m + 1, 0), prevFrom: ymd(y, m - 1, 1), prevTo: ymd(y, m, 0) }
  if (range === 'quarter') return { from: ymd(y, m - 2, 1), to: ymd(y, m + 1, 0), prevFrom: ymd(y, m - 5, 1), prevTo: ymd(y, m - 2, 0) }
  return { from: ymd(y, 0, 1), to: ymd(y, 11, 31), prevFrom: ymd(y - 1, 0, 1), prevTo: ymd(y - 1, 11, 31) }
}

/** Inicio del día en CDMX (UTC-6, sin horario de verano desde 2022) en ms */
const cdmxMs = (iso: string) => dateFromISO(iso).getTime() + 6 * 3_600_000

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
const change = (now: number, prev: number) => (prev ? Math.round(((now - prev) / prev) * 100) : null)

/** Lo cobrado de una reserva confirmada según su estado de pago */
const collected = (b: { paymentStatus: string; amountCents: number | null; depositCents: number | null }) =>
  b.paymentStatus === 'PAID' ? (b.amountCents ?? 0) : b.paymentStatus === 'DEPOSIT' ? (b.depositCents ?? 0) : 0

dashboard.get('/', async (c) => {
  const range = z.enum(['week', 'month', 'quarter', 'year']).default('month').safeParse(c.req.query('range'))
  if (!range.success) return invalid(c, range.error)

  const today = todayISO()
  const tomorrow = addDays(today, 1)
  const p = periods(range.data, today)
  const inRange = (from: string, to: string) => ({ gte: dateFromISO(from), lte: dateFromISO(to) })
  const createdIn = (from: string, to: string) => ({ gte: new Date(cdmxMs(from)), lt: new Date(cdmxMs(addDays(to, 1))) })
  const timeSlots = await bookingSlots()
  /** Horas vigentes + las de reservas hechas en una hora que ya se quitó */
  const withTimes = (times: string[]) => sortSlots([...timeSlots, ...times])

  const [bookings, prevBookings, blocks, soon, soonBlocks, pendingBookings, pendingReviews, openContacts, reviews, contacts, created, visits, prevVisits] =
    await Promise.all([
      prisma.booking.findMany({ where: { date: inRange(p.from, p.to) } }),
      prisma.booking.findMany({
        where: { date: inRange(p.prevFrom, p.prevTo) },
        select: { status: true, paymentStatus: true, amountCents: true, depositCents: true },
      }),
      prisma.blockedSlot.findMany({ where: { date: inRange(p.from, p.to) } }),
      prisma.booking.findMany({
        where: { date: inRange(today, tomorrow), status: { not: BookingStatus.CANCELLED } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.blockedSlot.findMany({ where: { date: inRange(today, tomorrow) } }),
      prisma.booking.findMany({
        where: { status: BookingStatus.PENDING, date: { gte: dateFromISO(today) } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 5,
      }),
      prisma.review.findMany({ where: { status: ReviewStatus.PENDING }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.contactRequest.findMany({ where: { handledAt: null }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.review.findMany({ where: { status: ReviewStatus.PUBLISHED, createdAt: createdIn(p.from, p.to) }, select: { rating: true } }),
      prisma.contactRequest.findMany({ where: { createdAt: createdIn(p.from, p.to) }, select: { topic: true, createdAt: true, handledAt: true } }),
      prisma.booking.count({ where: { createdAt: createdIn(p.from, p.to) } }),
      visitsBetween(cdmxMs(p.from), cdmxMs(addDays(p.to, 1))),
      visitsBetween(cdmxMs(p.prevFrom), cdmxMs(addDays(p.prevTo, 1))),
    ])

  // ── Hoy y mañana: cada horario libre, reservado o bloqueado
  const dayPlan = (iso: string) =>
    withTimes(soon.filter((x) => isoFromDate(x.date) === iso).map((x) => x.startTime)).map((time) => {
      const b = soon.find((x) => isoFromDate(x.date) === iso && x.startTime === time)
      if (b) return { time, kind: b.status === 'PENDING' ? 'pending' : 'confirmed', id: b.id, project: b.project, service: serviceLabel[b.service] }
      const block = soonBlocks.find((x) => isoFromDate(x.date) === iso && (x.startTime === null || x.startTime === time))
      if (block) return { time, kind: 'blocked', reason: block.reason ?? (block.startTime ? 'Bloqueado' : 'Cerrado') }
      return { time, kind: 'free' }
    })

  // ── Reservas del periodo
  const active = bookings.filter((b) => b.status !== 'CANCELLED')
  // Terminadas cuentan como confirmadas (la sesión se hizo)
  const isDone = (s: string) => s === 'CONFIRMED' || s === 'COMPLETED'
  const confirmed = bookings.filter((b) => isDone(b.status))
  const days = Math.round((dateFromISO(p.to).getTime() - dateFromISO(p.from).getTime()) / 86_400_000) + 1
  const blockedKeys = new Set<string>()
  for (const b of blocks) {
    const d = isoFromDate(b.date)
    for (const t of b.startTime ? [b.startTime] : timeSlots) blockedKeys.add(`${d} ${t}`)
  }
  const capacity = days * timeSlots.length - blockedKeys.size

  // ── Ingresos (solo reservas confirmadas con monto)
  const revenue = (list: typeof prevBookings) => {
    const conf = list.filter((b) => isDone(b.status))
    const total = conf.reduce((s, b) => s + (b.amountCents ?? 0), 0)
    const paid = conf.reduce((s, b) => s + collected(b), 0)
    return { paid: paid / 100, due: (total - paid) / 100 }
  }
  const rev = revenue(bookings)
  const prevRev = revenue(prevBookings)
  const revByService = bookingServices
    .map((label) => {
      const list = confirmed.filter((b) => serviceLabel[b.service] === label)
      const r = revenue(list)
      return { label, ...r }
    })
    .sort((a, b) => b.paid + b.due - (a.paid + a.due))

  // ── Demanda
  const services = bookingServices
    .map((label) => ({ label, count: active.filter((b) => serviceLabel[b.service] === label).length }))
    .sort((a, b) => b.count - a.count)
  const heatSlots = withTimes(active.map((b) => b.startTime))
  const heat = heatSlots.map((time) =>
    Array.from({ length: 7 }, (_, wd) => active.filter((b) => b.startTime === time && (b.date.getUTCDay() + 6) % 7 === wd).length),
  )

  // ── Opiniones y contactos
  const handled = contacts.filter((x) => x.handledAt)
  const topics = new Map<string, number>()
  for (const x of contacts) topics.set(x.topic, (topics.get(x.topic) ?? 0) + 1)
  const topTopic = [...topics.entries()].sort((a, b) => b[1] - a[1])[0]

  return c.json({
    range: range.data,
    period: p,
    today: { date: today, slots: dayPlan(today) },
    tomorrow: { date: tomorrow, slots: dayPlan(tomorrow).filter((s) => s.kind === 'pending' || s.kind === 'confirmed') },
    todo: {
      bookings: pendingBookings.map((b) => ({ id: b.id, date: isoFromDate(b.date), time: b.startTime, project: b.project, service: serviceLabel[b.service], rep: b.representativeName })),
      reviews: pendingReviews.map((r) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text })),
      contacts: openContacts.map((x) => ({ id: x.id, name: x.name, topic: x.topic, email: x.email, phone: x.phone, createdAt: x.createdAt })),
    },
    bookings: {
      total: bookings.length,
      prevTotal: prevBookings.length,
      change: change(bookings.length, prevBookings.length),
      confirmed: confirmed.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      cancelled: bookings.length - active.length,
      confirmedPct: pct(confirmed.length, bookings.length),
      cancelledPct: pct(bookings.length - active.length, bookings.length),
    },
    occupancy: {
      taken: active.length,
      capacity,
      pct: pct(active.length, capacity),
      prevPct: pct(prevBookings.filter((b) => b.status !== 'CANCELLED').length, days * timeSlots.length),
    },
    revenue: { ...rev, change: change(rev.paid, prevRev.paid), byService: revByService },
    services,
    heat,
    heatSlots,
    reviews: {
      count: reviews.length,
      average: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null,
    },
    contacts: {
      count: contacts.length,
      open: await prisma.contactRequest.count({ where: { handledAt: null } }),
      topTopic: topTopic ? { label: topTopic[0], count: topTopic[1] } : null,
      avgHours: handled.length
        ? Math.round(handled.reduce((s, x) => s + (x.handledAt!.getTime() - x.createdAt.getTime()), 0) / handled.length / 3_600_000)
        : null,
    },
    visits: visits && {
      ...visits,
      change: prevVisits ? change(visits.visitors, prevVisits.visitors) : null,
      bookings: created,
      conversion: visits.visitors ? Math.round((created / visits.visitors) * 1000) / 10 : null,
    },
  })
})
