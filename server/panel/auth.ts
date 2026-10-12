import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { prisma } from '../shared/db'
import { AdminRole } from '../generated/prisma/enums'
import { fail } from '../shared/lib/errors'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const KEY_LEN = 64

export const SESSION_COOKIE = 'hf_admin'
/** Vence a los 7 días aunque se use */
const SESSION_DAYS = 7
/** Sin uso durante 12 h, la sesión se cierra */
const IDLE_MS = 12 * 3_600_000
/** Cada cuánto se anota el último uso (no en cada petición) */
const TOUCH_MS = 5 * 60_000

/** "salt:hash" en hex */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEY_LEN)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

const sha256 = (token: string) => createHash('sha256').update(token).digest('hex')

/** Hash con el que se compara cuando el correo no existe, para que tarde lo mismo (no delata qué correos hay) */
export const DUMMY_HASH = `${'0'.repeat(32)}:${'0'.repeat(128)}`

/** Navegador del cliente, recortado para guardarlo */
export const userAgentOf = (c: Context) => c.req.header('user-agent')?.slice(0, 300) ?? null

/** Crea la sesión y pone la cookie; en la BD solo queda el hash del token */
export async function startSession(c: Context, userId: string, ip: string | null) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await prisma.adminSession.create({ data: { tokenHash: sha256(token), userId, expiresAt, ip, userAgent: userAgentOf(c) } })
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api',
    expires: expiresAt,
  })
}

export async function endSession(c: Context) {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } })
  deleteCookie(c, SESSION_COOKIE, { path: '/api' })
}

export interface AdminVariables {
  admin: { id: string; email: string; name: string; firstName: string; lastName: string; isRoot: boolean; role: AdminRole }
  /** Sesión de esta petición (para no cerrarla al cerrar "las demás") */
  sessionId: string
}

/**
 * Lo que puede usar el rol STAFF, además de su sesión y su cuenta: Agenda (reservas y bloqueos) y Contactos.
 * Rutas bajo /api/admin; vale la ruta exacta o lo que cuelga de ella.
 */
const STAFF_ALLOWED = ['/me', '/summary', '/events', '/bookings', '/blocks', '/contacts', '/users/me']

/** Va después de requireAdmin: el rol STAFF recibe 403 fuera de lo suyo (no basta con ocultar pestañas) */
export const requireRole: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  if (c.get('admin').role === AdminRole.STAFF) {
    const sub = c.req.path.replace(/^\/api\/admin/, '')
    if (!STAFF_ALLOWED.some((p) => sub === p || sub.startsWith(`${p}/`))) return fail(c, 403, 'Tu rol solo tiene acceso a Agenda y Contactos')
  }
  await next()
}

/** Exige sesión válida; deja al usuario en `c.get('admin')` */
export const requireAdmin: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return fail(c, 401, 'Inicia sesión')
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, firstName: true, lastName: true, isRoot: true, role: true } } },
  })
  const now = Date.now()
  if (!session || session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + IDLE_MS <= now) {
    if (session) await prisma.adminSession.deleteMany({ where: { id: session.id } })
    deleteCookie(c, SESSION_COOKIE, { path: '/api' })
    return fail(c, 401, 'Inicia sesión')
  }
  if (session.lastSeenAt.getTime() + TOUCH_MS <= now) {
    await prisma.adminSession.updateMany({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } })
  }
  c.set('admin', session.user)
  c.set('sessionId', session.id)
  await next()
}
