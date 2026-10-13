/**
 * Cifras de visitas desde Umami (self-hosted en docker-compose).
 * Sin UMAMI_URL / UMAMI_WEBSITE_ID / credenciales, o si Umami no responde, devuelve null
 * y el dashboard muestra la tarjeta de visitas sin datos.
 */

const URL_BASE = process.env.UMAMI_URL?.replace(/\/$/, '')
const WEBSITE = process.env.UMAMI_WEBSITE_ID
const USER = process.env.UMAMI_USERNAME
const PASS = process.env.UMAMI_PASSWORD

export const umamiConfigured = !!(URL_BASE && WEBSITE && USER && PASS)

let token: { value: string; until: number } | null = null

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${URL_BASE}${path}`, { ...init, signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`Umami ${res.status}`)
  return res.json()
}

async function auth(): Promise<string> {
  if (token && token.until > Date.now()) return token.value
  const data = (await call('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  })) as { token: string }
  token = { value: data.token, until: Date.now() + 50 * 60_000 }
  return token.value
}

async function get(path: string): Promise<unknown> {
  const t = await auth()
  return call(path, { headers: { Authorization: `Bearer ${t}` } })
}

/** Umami cambió el formato entre versiones: `{ value }` (v2) o número directo (v3) */
const num = (v: unknown): number =>
  typeof v === 'number' ? v : typeof v === 'object' && v && 'value' in v ? Number((v as { value: unknown }).value) || 0 : 0

export interface Visits {
  visitors: number
  pageviews: number
  /** Vistas de /reservar */
  bookingViews: number
}

/** Vistas por ruta; la métrica se llama "url" en v2 y "path" en v3 */
async function pagesOf(q: string): Promise<{ x: string; y: number }[]> {
  for (const type of ['url', 'path']) {
    try {
      return (await get(`/api/websites/${WEBSITE}/metrics?${q}&type=${type}`)) as { x: string; y: number }[]
    } catch {
      // probar el otro nombre
    }
  }
  return []
}

/** Vistas de las rutas que empiezan con `prefix` (p. ej. /plugins) entre dos instantes (ms); null sin Umami */
export async function pathViews(prefix: string, startAt: number, endAt: number): Promise<number | null> {
  if (!umamiConfigured) return null
  try {
    const pages = await pagesOf(`startAt=${startAt}&endAt=${endAt}`)
    return pages.filter((p) => p.x?.startsWith(prefix)).reduce((s, p) => s + p.y, 0)
  } catch (err) {
    console.warn('[umami]', (err as Error).message)
    return null
  }
}

/** Visitas entre dos instantes (ms) */
export async function visitsBetween(startAt: number, endAt: number): Promise<Visits | null> {
  if (!umamiConfigured) return null
  try {
    const q = `startAt=${startAt}&endAt=${endAt}`
    const stats = (await get(`/api/websites/${WEBSITE}/stats?${q}`)) as Record<string, unknown>
    const pages = await pagesOf(q)
    return {
      visitors: num(stats.visitors),
      pageviews: num(stats.pageviews),
      bookingViews: pages.filter((p) => p.x?.startsWith('/reservar')).reduce((s, p) => s + p.y, 0),
    }
  } catch (err) {
    console.warn('[umami]', (err as Error).message)
    return null
  }
}
