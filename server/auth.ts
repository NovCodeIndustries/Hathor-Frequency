import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { prisma } from './db'
import { fail } from './lib/errors'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const KEY_LEN = 64

export const SESSION_COOKIE = 'hf_admin'
const SESSION_DAYS = 7

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

/** Crea la sesión y pone la cookie; en la BD solo queda el hash del token */
export async function startSession(c: Context, userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await prisma.adminSession.create({ data: { tokenHash: sha256(token), userId, expiresAt } })
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
  admin: { id: string; email: string; name: string; firstName: string; lastName: string; isRoot: boolean }
}

/** Exige sesión válida; deja al usuario en `c.get('admin')` */
export const requireAdmin: MiddlewareHandler<{ Variables: AdminVariables }> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return fail(c, 401, 'Inicia sesión')
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, firstName: true, lastName: true, isRoot: true } } },
  })
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } })
    deleteCookie(c, SESSION_COOKIE, { path: '/api' })
    return fail(c, 401, 'Inicia sesión')
  }
  c.set('admin', session.user)
  await next()
}

/**
 * Anti-CSRF para escrituras: solo JSON (un formulario de otro sitio no puede mandarlo sin preflight)
 * y, si el navegador manda Origin, que coincida con el Host.
 */
export const jsonOnly: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    if (!c.req.header('content-type')?.startsWith('application/json')) return fail(c, 415, 'Se esperaba JSON')
    const origin = c.req.header('origin')
    const host = c.req.header('x-forwarded-host') ?? c.req.header('host')
    if (origin && host && new URL(origin).host !== host) return fail(c, 403, 'Origen no permitido')
  }
  await next()
}
