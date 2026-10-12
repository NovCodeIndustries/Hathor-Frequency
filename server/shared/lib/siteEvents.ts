import pg from 'pg'
import { prisma } from '../db'

/**
 * Avisos en vivo entre la web y el panel, que son procesos separados:
 * - a la web abierta (`GET /api/site/events`, SSE): `site` al publicar módulos, `content` al publicar una sección,
 *   `stats`, `availability`, `reviews` y `refresh` (volver a pedir todo);
 * - al panel (`GET /api/admin/events`): qué cambió (`booking`, `contact`, …).
 * Cada aviso se entrega a este proceso y se manda a los demás por PostgreSQL (`NOTIFY hf_events`); cada proceso
 * escucha con `LISTEN` (`listenEvents`). Si el otro servicio está apagado el aviso se pierde sin más:
 * todo vive en la base y se lee al volver.
 * Además queda en un feed para el respaldo por long-polling (`…/events/poll`), para donde el SSE no pasa.
 */

/** Cambia en cada arranque: si el cliente trae otro, perdió avisos y debe recargar todo */
const BOOT = Math.random().toString(36).slice(2, 10)

export interface FeedPage<T> {
  boot: string
  seq: number
  items: T[]
  /** Se perdieron avisos (reinicio o demasiados): hay que volver a pedir todo */
  reset: boolean
}

/** Últimos avisos numerados; `since` responde en cuanto hay alguno nuevo o al vencer la espera */
function createFeed<T>(size = 200) {
  let seq = 0
  const items: { seq: number; value: T }[] = []
  const waiters = new Set<() => void>()

  const page = (boot: string, after: number): FeedPage<T> | null => {
    if (boot !== BOOT || after < 0 || after > seq) return { boot: BOOT, seq, items: [], reset: boot !== '' }
    if (after === seq) return null
    const oldest = items[0]?.seq ?? seq + 1
    if (oldest > after + 1) return { boot: BOOT, seq, items: [], reset: true }
    return { boot: BOOT, seq, items: items.filter((i) => i.seq > after).map((i) => i.value), reset: false }
  }

  return {
    push(value: T) {
      items.push({ seq: ++seq, value })
      if (items.length > size) items.shift()
      waiters.forEach((w) => w())
      waiters.clear()
    },
    async since(boot: string, after: number, waitMs: number, signal?: AbortSignal): Promise<FeedPage<T>> {
      const now = page(boot, after)
      if (now) return now
      await new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer)
          waiters.delete(done)
          signal?.removeEventListener('abort', done)
          resolve()
        }
        const timer = setTimeout(done, waitMs)
        waiters.add(done)
        signal?.addEventListener('abort', done)
      })
      return page(boot, after) ?? { boot: BOOT, seq, items: [], reset: false }
    },
  }
}

/** Lo que espera una consulta de long-polling antes de responder vacía (el túnel corta a los 100 s) */
export const POLL_WAIT_MS = 25_000

type Listener = (event: string, data: unknown) => void
const listeners = new Set<Listener>()
export const siteFeed = createFeed<{ event: string; data: unknown }>()

export function onLiveEvent(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export type LiveEvent = 'site' | 'content' | 'stats' | 'availability' | 'reviews' | 'refresh'

function deliverLive(event: LiveEvent, data: unknown) {
  for (const l of listeners) l(event, data)
  siteFeed.push({ event, data })
}

export function emitLive(event: LiveEvent, data: unknown) {
  deliverLive(event, data)
  void notify({ to: 'site', event, data })
}

export const emitSitePublished = (disabled: string[]) => emitLive('site', { disabled })

// ── Avisos del panel (solo admins con sesión: GET /api/admin/events) ──

/** Qué cambió: el panel recarga los contadores de la barra y la vista que lo muestre */
export type AdminEventKind = 'booking' | 'contact' | 'review' | 'block' | 'site' | 'content' | 'users'
const ADMIN_KINDS: AdminEventKind[] = ['booking', 'contact', 'review', 'block', 'site', 'content', 'users']

type AdminListener = (kind: AdminEventKind) => void
const adminListeners = new Set<AdminListener>()
export const adminFeed = createFeed<AdminEventKind>()

export function onAdminEvent(l: AdminListener): () => void {
  adminListeners.add(l)
  return () => adminListeners.delete(l)
}

function deliverAdmin(kind: AdminEventKind) {
  for (const l of adminListeners) l(kind)
  adminFeed.push(kind)
}

export function emitAdmin(kind: AdminEventKind) {
  deliverAdmin(kind)
  void notify({ to: 'admin', event: kind })
}

/** Cambió la disponibilidad pública (reservas o bloqueos): el calendario de Reservar se vuelve a pedir */
export const emitAvailability = () => emitLive('availability', {})

// ── Entre procesos: PostgreSQL LISTEN/NOTIFY ──

const CHANNEL = 'hf_events'
/** NOTIFY acepta hasta 8000 bytes; un aviso más grande viaja como `refresh` (se vuelve a pedir todo) */
const MAX_PAYLOAD = 7500

interface Wire {
  from: string
  to: 'site' | 'admin'
  event: string
  data?: unknown
}

async function notify(msg: Omit<Wire, 'from'>) {
  let payload = JSON.stringify({ ...msg, from: BOOT } satisfies Wire)
  if (Buffer.byteLength(payload) > MAX_PAYLOAD) payload = JSON.stringify({ from: BOOT, to: msg.to, event: 'refresh' } satisfies Wire)
  try {
    await prisma.$executeRaw`SELECT pg_notify(${CHANNEL}, ${payload})`
  } catch (err) {
    console.warn('[events] No se pudo avisar a los demás servicios:', (err as Error).message)
  }
}

function receive(raw: string | undefined) {
  let msg: Wire
  try {
    msg = JSON.parse(raw ?? '') as Wire
  } catch {
    return
  }
  // Lo propio ya se entregó al emitirlo
  if (msg.from === BOOT) return
  if (msg.to === 'site') deliverLive(msg.event as LiveEvent, msg.data ?? null)
  else if (ADMIN_KINDS.includes(msg.event as AdminEventKind)) deliverAdmin(msg.event as AdminEventKind)
}

/** Tras un corte con la base pudieron perderse avisos: la web y el panel vuelven a pedir todo */
function resync() {
  deliverLive('refresh', null)
  ADMIN_KINDS.forEach(deliverAdmin)
}

/** Escucha los avisos de los demás servicios; se reconecta solo si la base se cae */
export async function listenEvents(service: string, retryMs = 3000): Promise<void> {
  let dropped = false
  const connect = async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    const retry = () => {
      if (dropped) return
      dropped = true
      client.removeAllListeners()
      client.end().catch(() => {})
      setTimeout(() => {
        dropped = false
        void connect().then((ok) => ok && resync())
      }, retryMs)
    }
    client.on('error', (err) => {
      console.warn(`[events:${service}] Conexión perdida:`, err.message)
      retry()
    })
    client.on('end', retry)
    client.on('notification', (n) => n.channel === CHANNEL && receive(n.payload))
    try {
      await client.connect()
      await client.query(`LISTEN ${CHANNEL}`)
      return true
    } catch (err) {
      console.warn(`[events:${service}] No se pudo escuchar (${(err as Error).message}); reintento en ${retryMs / 1000} s`)
      retry()
      return false
    }
  }
  await connect()
}
