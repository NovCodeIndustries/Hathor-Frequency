import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Cifrado con APP_SECRET (.env): AES-256-GCM para guardar algo que hay que volver a leer (la contraseña temporal,
 * la clave del 2FA) y HMAC para firmar pases cortos (el del segundo paso del login). Sin APP_SECRET no hay ninguno.
 */

const key = (purpose: string) => {
  const secret = process.env.APP_SECRET
  return secret ? createHash('sha256').update(`${purpose}:${secret}`).digest() : null
}
// La contraseña temporal se cifró desde el principio con sha256(APP_SECRET), sin propósito: se conserva
const sealKey = () => {
  const secret = process.env.APP_SECRET
  return secret ? createHash('sha256').update(secret).digest() : null
}

export const hasAppSecret = () => !!process.env.APP_SECRET

/** "iv.tag.datos" en base64url, o null si falta APP_SECRET */
export function seal(plain: string): string | null {
  const k = sealKey()
  if (!k) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', k, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

/** El texto en claro, o null si no hay, falta APP_SECRET o cambió */
export function unseal(sealed: string | null): string | null {
  const k = sealKey()
  if (!sealed || !k) return null
  try {
    const [iv, tag, data] = sealed.split('.').map((s) => Buffer.from(s, 'base64url'))
    const decipher = createDecipheriv('aes-256-gcm', k, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/** Pase firmado "datos.firma" que vence en `ttlMs` (null sin APP_SECRET) */
export function signPass(purpose: string, data: string, ttlMs: number): string | null {
  const k = key(purpose)
  if (!k) return null
  const body = Buffer.from(JSON.stringify({ d: data, e: Date.now() + ttlMs })).toString('base64url')
  return `${body}.${createHmac('sha256', k).update(body).digest('base64url')}`
}

/** Los datos de un pase válido y vigente, o null */
export function readPass(purpose: string, pass: string): string | null {
  const k = key(purpose)
  const [body, sig] = pass.split('.')
  if (!k || !body || !sig) return null
  const want = createHmac('sha256', k).update(body).digest()
  const got = Buffer.from(sig, 'base64url')
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null
  try {
    const { d, e } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { d: string; e: number }
    return typeof d === 'string' && e > Date.now() ? d : null
  } catch {
    return null
  }
}
