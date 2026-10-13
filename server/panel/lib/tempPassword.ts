import { randomInt } from 'node:crypto'
import { seal, unseal } from './secretBox'

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

/** "iv.tag.datos" en base64url, o null si falta APP_SECRET */
export function sealTempPassword(plain: string): string | null {
  const sealed = seal(plain)
  if (!sealed) console.warn('[admin] Falta APP_SECRET en .env: la contraseña temporal solo se muestra al crearla')
  return sealed
}

/** La temporal en claro, o null si no hay, falta APP_SECRET o cambió */
export const openTempPassword = (sealed: string | null): string | null => unseal(sealed)
