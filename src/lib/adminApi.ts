import { MONTHS } from './calendar'
import { formatClock } from './time'

/**
 * Cliente del panel de admin (`/api/admin/*`, server/routes/admin.ts).
 * La sesión va en la cookie httpOnly `hf_admin`; el navegador la manda sola.
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED'
export type PaymentStatus = 'PENDING' | 'DEPOSIT' | 'PAID'

export interface AdminUser {
  id: string
  email: string
  name: string
}

export interface AdminSummary {
  pendingBookings: number
  pendingReviews: number
  openContacts: number
}


export interface AdminBooking {
  id: string
  /** YYYY-MM-DD */
  date: string
  startTime: string
  /** Etiqueta del frontend ("Grabación") */
  service: string
  status: BookingStatus
  project: string
  representativeType: 'INTEGRANTE' | 'EXTERNO'
  representativeName: string
  phone: string
  email: string
  /** Monto acordado en pesos (null = sin capturar) */
  amount: number | null
  paymentStatus: PaymentStatus
  /** Anticipo recibido en pesos (solo con paymentStatus DEPOSIT) */
  deposit: number | null
  paidAt: string | null
  createdAt: string
}

/** Cambios de una reserva desde el panel (estado y cobro) */
export interface BookingPatch {
  status?: BookingStatus
  amount?: number | null
  paymentStatus?: PaymentStatus
  deposit?: number | null
}

export type DashboardRange = 'week' | 'month' | 'quarter' | 'year'

export interface DaySlot {
  time: string
  kind: 'free' | 'pending' | 'confirmed' | 'blocked'
  id?: string
  project?: string
  service?: string
  reason?: string
}

/** Respuesta de `GET /api/admin/dashboard` (server/routes/dashboard.ts) */
export interface Dashboard {
  range: DashboardRange
  period: { from: string; to: string; prevFrom: string; prevTo: string }
  today: { date: string; slots: DaySlot[] }
  tomorrow: { date: string; slots: DaySlot[] }
  todo: {
    bookings: { id: string; date: string; time: string; project: string; service: string; rep: string }[]
    reviews: { id: string; name: string; rating: number; text: string }[]
    contacts: { id: string; name: string; topic: string; email: string; createdAt: string }[]
  }
  bookings: {
    total: number
    prevTotal: number
    change: number | null
    confirmed: number
    pending: number
    cancelled: number
    confirmedPct: number
    cancelledPct: number
  }
  occupancy: { taken: number; capacity: number; pct: number; prevPct: number }
  revenue: { paid: number; due: number; change: number | null; byService: { label: string; paid: number; due: number }[] }
  services: { label: string; count: number }[]
  /** [horario][día lunes..domingo] = reservas */
  heat: number[][]
  reviews: { count: number; average: number | null }
  contacts: { count: number; open: number; topTopic: { label: string; count: number } | null; avgHours: number | null }
  /** null si Umami no está configurado o no responde */
  visits: {
    visitors: number
    pageviews: number
    bookingViews: number
    change: number | null
    bookings: number
    conversion: number | null
  } | null
}

export interface AdminReview {
  id: string
  rating: number
  name: string
  project: string | null
  service: string
  text: string
  consent: boolean
  status: ReviewStatus
  createdAt: string
}

export interface AdminContact {
  id: string
  name: string
  topic: string
  email: string
  handledAt: string | null
  createdAt: string
}

export interface AdminBlock {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** null = el día completo */
  startTime: string | null
  reason: string | null
}

/** Error de la API del panel; `status` 401 = sin sesión */
export class AdminApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AdminApiError(0, 'Sin conexión con el servidor')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AdminApiError(res.status, (data as { error?: string }).error ?? 'Error del servidor')
  return data as T
}

const query = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString()
  return q ? `?${q}` : ''
}

export const adminApi = {
  login: (email: string, password: string) => request<AdminUser>('POST', '/login', { email, password }),
  logout: () => request<{ ok: true }>('POST', '/logout', {}),
  me: () => request<AdminUser>('GET', '/me'),
  summary: () => request<AdminSummary>('GET', '/summary'),

  bookings: (params: { from?: string; to?: string; status?: BookingStatus } = {}) =>
    request<AdminBooking[]>('GET', `/bookings${query(params)}`),
  setBookingStatus: (id: string, status: BookingStatus) => request<AdminBooking>('PATCH', `/bookings/${id}`, { status }),
  updateBooking: (id: string, patch: BookingPatch) => request<AdminBooking>('PATCH', `/bookings/${id}`, patch),

  dashboard: (range: DashboardRange) => request<Dashboard>('GET', `/dashboard?range=${range}`),


  reviews: () => request<AdminReview[]>('GET', '/reviews'),
  setReviewStatus: (id: string, status: ReviewStatus) => request<AdminReview>('PATCH', `/reviews/${id}`, { status }),

  contacts: () => request<AdminContact[]>('GET', '/contacts'),
  setContactHandled: (id: string, handled: boolean) => request<AdminContact>('PATCH', `/contacts/${id}`, { handled }),

  blocks: (params: { from?: string; to?: string } = {}) => request<AdminBlock[]>('GET', `/blocks${query(params)}`),
  addBlock: (date: string, time?: string, reason?: string) =>
    request<AdminBlock>('POST', '/blocks', { date, time, reason: reason || undefined }),
  removeBlock: (id: string) => request<{ ok: true }>('DELETE', `/blocks/${id}`),
}

/** "11 oct, 6:05 p. m." */
export function formatStamp(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}, ${formatClock(d)}`
}

/** "$38,400" (pesos, sin centavos si son cero) */
export const formatMoney = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

/** "YYYY-MM-DD" → Date local (sin desfase de zona) */
export const dateFromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
