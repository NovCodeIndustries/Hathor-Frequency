import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'node:crypto'

/**
 * Contraseñas temporales de los usuarios nuevos: se generan solas, se guardan con hash (para entrar) y además
 * cifradas con APP_SECRET (AES-256-GCM) para que el principal las vea hasta que la persona ponga la suya.
 * Sin APP_SECRET no se guarda la copia cifrada: la temporal solo se muestra una vez, al crearla.
 */

// Sin letras ni números que se confunden (0/O, 1/l/I)
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** "hf-K7pQ-x9Wm-3Tz" (16 caracteres) */
export function generateTempPassword(): string {
  const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `hf-${block()}-${block()}-${block().slice(0, 3)}`
}

const key = () => {
  const secret = process.env.APP_SECRET
  return secret ? createHash('sha256').update(secret).digest() : null
}

/** "iv.tag.datos" en base64url, o null si falta APP_SECRET */
export function sealTempPassword(plain: string): string | null {
  const k = key()
  if (!k) {
    console.warn('[admin] Falta APP_SECRET en .env: la contraseña temporal solo se muestra al crearla')
    return null
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', k, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

/** La temporal en claro, o null si no hay, falta APP_SECRET o cambió */
export function openTempPassword(sealed: string | null): string | null {
  const k = key()
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
