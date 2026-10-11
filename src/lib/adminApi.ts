/**
 * Cliente del panel de admin (`/api/admin/*`, server/routes/admin.ts).
 * La sesión va en la cookie httpOnly `hf_admin`; el navegador la manda sola.
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED'

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
  createdAt: string
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

  reviews: () => request<AdminReview[]>('GET', '/reviews'),
  setReviewStatus: (id: string, status: ReviewStatus) => request<AdminReview>('PATCH', `/reviews/${id}`, { status }),

  contacts: () => request<AdminContact[]>('GET', '/contacts'),
  setContactHandled: (id: string, handled: boolean) => request<AdminContact>('PATCH', `/contacts/${id}`, { handled }),

  blocks: (params: { from?: string; to?: string } = {}) => request<AdminBlock[]>('GET', `/blocks${query(params)}`),
  addBlock: (date: string, time?: string, reason?: string) =>
    request<AdminBlock>('POST', '/blocks', { date, time, reason: reason || undefined }),
  removeBlock: (id: string) => request<{ ok: true }>('DELETE', `/blocks/${id}`),
}

/** "11 oct, 18:05" */
export function formatStamp(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** "YYYY-MM-DD" → Date local (sin desfase de zona) */
export const dateFromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
