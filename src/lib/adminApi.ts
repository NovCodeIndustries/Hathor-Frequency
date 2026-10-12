import { MONTHS } from './calendar'
import { formatClock } from './time'

/**
 * Cliente del panel de admin (`/api/admin/*`, server/routes/admin.ts).
 * La sesión va en la cookie httpOnly `hf_admin`; el navegador la manda sola.
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED'
export type PaymentStatus = 'PENDING' | 'DEPOSIT' | 'PAID'

export interface AdminUser {
  id: string
  email: string
  /** Nombre completo */
  name: string
  firstName: string
  lastName: string
  /** Usuario principal: no se puede borrar y administra a los demás */
  isRoot: boolean
  role: AdminRole
}

/** ADMIN: todo el panel · STAFF: solo Agenda, Contactos y Mi cuenta */
export type AdminRole = 'ADMIN' | 'STAFF'

export const ROLE_LABEL: Record<AdminRole, string> = { ADMIN: 'Admin', STAFF: 'Staff' }
export const ROLE_HINT: Record<AdminRole, string> = { ADMIN: 'Todo el panel', STAFF: 'Solo Agenda, Contactos y Mi cuenta' }

/** Rutas del panel que ve el rol STAFF (el servidor también lo exige) */
export const STAFF_ROUTES = ['/admin/reservas', '/admin/contactos', '/admin/usuarios']

export interface AdminUserRow extends AdminUser {
  middleName: string | null
  secondLastName: string | null
  phone: string | null
  /** Bloqueada por intentos fallidos hasta esa hora, solo si sigue vigente (se quita sola o con una contraseña nueva) */
  lockedUntil: string | null
  createdAt: string
}

/** Nombre y teléfono de un usuario, lo que se edita en Usuarios */
export type AdminUserProfile = Omit<NewAdminUser, 'password'>

export interface NewAdminUser {
  firstName: string
  middleName?: string
  lastName: string
  secondLastName?: string
  phone: string
  role: AdminRole
  password: string
}

/** "Xavier Ruiz": primer nombre + primer apellido (para saludos y la barra) */
export const shortName = (u: { firstName?: string; lastName?: string; name: string }) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name

export interface AdminSummary {
  pendingBookings: number
  pendingReviews: number
  openContacts: number
  /** Cambios del panel · Sitio sin publicar */
  siteChanges: number
  /** Secciones del panel · Contenido con cambios sin publicar */
  contentChanges: number
  /** Web en mantenimiento (panel · Sitio) */
  maintenance: MaintenanceState
}

/** Modo mantenimiento de la web completa */
export interface MaintenanceState {
  enabled: boolean
  message: string | null
  /** Regreso estimado (ISO) */
  until: string | null
  startedAt: string | null
  updatedByName: string | null
}

export interface FieldIssue {
  path: (string | number)[]
  message: string
}

/** Estado de una sección del panel · Contenido */
export interface ContentState {
  key: string
  draft: unknown
  published: unknown
  versionId: string | null
  dirty: boolean
  issues: FieldIssue[]
}

export interface MediaEntry {
  name: string
  path: string
  kind: 'dir' | 'image' | 'video' | 'other'
  size: number
  modifiedAt: string
}

/** Respuesta del buscador de archivos del HDD de medios */
export interface MediaListing {
  configured: boolean
  dir: string
  parent: string | null
  query?: string
  entries: MediaEntry[]
}

export interface ContentVersionInfo {
  id: string
  summary: string
  publishedAt: string
  publishedByName: string
  current: boolean
}

/** Estado del panel · Sitio: ids apagados en el borrador y en lo publicado */
export interface SiteState {
  draft: string[]
  published: string[]
  versionId: string | null
  updatedAt: string | null
}

export interface SiteVersionInfo {
  id: string
  publishedAt: string
  publishedByName: string
  current: boolean
  /** Ids que esta versión ocultó / volvió a mostrar respecto a la anterior */
  hidden: string[]
  shown: string[]
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
    contacts: { id: string; name: string; topic: string; email: string; phone: string | null; createdAt: string }[]
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
  /** Horas de cada fila de `heat` (24 h) */
  heatSlots: string[]
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
  /** null en los contactos anteriores al 2026-10-12 */
  phone: string | null
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

/** Una sesión abierta de mi cuenta (Mi cuenta · Sesiones) */
export interface AdminSessionRow {
  id: string
  createdAt: string
  lastSeenAt: string
  ip: string | null
  userAgent: string | null
  current: boolean
}

/** Un intento de login (Usuarios · Registro de accesos) */
export interface AccessLogRow {
  id: string
  email: string
  success: boolean
  reason: 'password' | 'unknown' | 'locked' | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: { name: string } | null
}

/** "Chrome · Android" a partir del user-agent */
export function describeDevice(ua: string | null): string {
  if (!ua) return 'Navegador desconocido'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /curl|node|python/i.test(ua) ? 'Script' : 'Navegador'
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
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
      // Toda escritura va como JSON (la API rechaza otras: anti-CSRF), también un DELETE sin cuerpo
      headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
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

/** Sesión agendada desde el panel (`time` en 24 h; correo opcional) */
export interface NewBooking {
  date: string
  time: string
  service: string
  project: string
  representativeType: 'integrante' | 'externo'
  representativeName: string
  phone: string
  email: string
  status: 'PENDING' | 'CONFIRMED'
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
  createBooking: (b: NewBooking) => request<AdminBooking>('POST', '/bookings', b),
  searchBookings: (q: string) => request<AdminBooking[]>('GET', `/bookings/search${query({ q })}`),

  dashboard: (range: DashboardRange) => request<Dashboard>('GET', `/dashboard?range=${range}`),

  site: () => request<SiteState>('GET', '/site'),
  saveSiteDraft: (disabled: string[]) => request<SiteState>('PUT', '/site/draft', { disabled }),
  publishSite: () => request<SiteState>('POST', '/site/publish', {}),
  discardSite: () => request<SiteState>('POST', '/site/discard', {}),
  siteHistory: () => request<SiteVersionInfo[]>('GET', '/site/history'),
  restoreSite: (id: string) => request<SiteState>('POST', `/site/restore/${id}`, {}),
  maintenance: () => request<MaintenanceState>('GET', '/site/maintenance'),
  setMaintenance: (m: { enabled: boolean; message?: string; until?: string | null }) => request<MaintenanceState>('PUT', '/site/maintenance', m),

  contentDirty: () => request<{ dirty: string[] }>('GET', '/content'),
  content: (key: string) => request<ContentState>('GET', `/content/${key}`),
  saveContentDraft: (key: string, data: unknown) => request<ContentState>('PUT', `/content/${key}/draft`, { data }),
  publishContent: (key: string) => request<ContentState>('POST', `/content/${key}/publish`, {}),
  discardContent: (key: string) => request<ContentState>('POST', `/content/${key}/discard`, {}),
  contentHistory: (key: string) => request<ContentVersionInfo[]>('GET', `/content/${key}/history`),
  restoreContent: (key: string, id: string) => request<ContentState>('POST', `/content/${key}/restore/${id}`, {}),
  users: () => request<AdminUserRow[]>('GET', '/users'),
  createUser: (user: NewAdminUser) => request<AdminUserRow>('POST', '/users', user),
  setUserPassword: (id: string, password: string) => request<{ ok: true }>('PATCH', `/users/${id}/password`, { password }),
  deleteUser: (id: string) => request<{ ok: true }>('DELETE', `/users/${id}`),
  updateUser: (id: string, profile: AdminUserProfile & { regenerateEmail?: boolean }) => request<AdminUserRow>('PATCH', `/users/${id}`, profile),
  mySessions: () => request<AdminSessionRow[]>('GET', '/users/me/sessions'),
  closeSession: (id: string) => request<{ ok: true }>('DELETE', `/users/me/sessions/${id}`),
  closeOtherSessions: () => request<{ ok: true; closed: number }>('DELETE', '/users/me/sessions'),
  accessLog: () => request<AccessLogRow[]>('GET', '/users/access-log'),
  changeMyPassword: (current: string, next: string) => request<{ ok: true }>('PATCH', '/users/me/password', { current, next }),

  mediaList: (params: { dir?: string; q?: string }) =>
    request<MediaListing>('GET', `/media/list${query({ dir: params.dir, q: params.q })}`),
  mediaCheck: (path: string) => request<{ path: string; exists: boolean | null }>('GET', `/media/check?path=${encodeURIComponent(path)}`),

  reviews: () => request<AdminReview[]>('GET', '/reviews'),
  setReviewStatus: (id: string, status: ReviewStatus) => request<AdminReview>('PATCH', `/reviews/${id}`, { status }),
  deleteReview: (id: string) => request<{ ok: true }>('DELETE', `/reviews/${id}`),

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
