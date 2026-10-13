import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto'
import QRCode from 'qrcode'
import type { AdminUser } from '../../generated/prisma/client'
import { prisma } from '../../shared/db'
import { seal, unseal } from './secretBox'

/**
 * Verificación en dos pasos con app autenticadora (TOTP, RFC 6238: SHA-1, 6 dígitos, 30 s), sin servicios externos.
 * La clave se guarda cifrada con APP_SECRET; los códigos de respaldo, solo con hash. Un código de la app no sirve
 * dos veces (`twoFactorLastStep`) y se acepta un paso de desfase (±30 s) por la hora del teléfono.
 */

const ISSUER = 'Hathor Frequency'
const STEP_MS = 30_000
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function toBase32(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function fromBase32(s: string): Buffer {
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of s.replace(/[\s=]/g, '').toUpperCase()) {
    const i = B32.indexOf(ch)
    if (i < 0) continue
    value = (value << 5) | i
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function codeAt(secret: Buffer, step: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(step))
  const h = createHmac('sha1', secret).update(msg).digest()
  const o = h[h.length - 1] & 15
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}

/** Paso de 30 s en el que coincide el código (ahora, uno antes o uno después), o null */
function matchStep(secretB32: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null
  const secret = fromBase32(secretB32)
  const step = Math.floor(now / STEP_MS)
  for (const s of [step, step - 1, step + 1]) if (codeAt(secret, s) === code) return s
  return null
}

/** "6 dígitos" con espacios y guiones quitados */
export const cleanCode = (code: string) => code.replace(/[\s-]/g, '')

// ── Activación ──

export interface TwoFactorSetup {
  /** Clave para escribirla a mano, en grupos de 4 */
  secret: string
  otpauth: string
  /** QR como SVG (texto) */
  qr: string
}

/** Clave nueva a medio activar (se guarda cifrada; vale hasta que confirme un código). null sin APP_SECRET */
export async function startSetup(user: Pick<AdminUser, 'id' | 'username'>): Promise<TwoFactorSetup | null> {
  const secret = toBase32(randomBytes(20))
  const sealed = seal(secret)
  if (!sealed) return null
  await prisma.adminUser.update({ where: { id: user.id }, data: { twoFactorSecret: sealed, twoFactorAt: null, twoFactorLastStep: null } })
  const label = encodeURIComponent(`${ISSUER}:${user.username}`)
  const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`
  const qr = await QRCode.toString(otpauth, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
  return { secret: secret.match(/.{1,4}/g)!.join(' '), otpauth, qr }
}

/** Confirma la clave a medio activar con un código de la app; devuelve el paso aceptado o null */
export function checkPendingCode(user: Pick<AdminUser, 'twoFactorSecret'>, code: string): number | null {
  const secret = unseal(user.twoFactorSecret)
  return secret ? matchStep(secret, cleanCode(code)) : null
}

// ── Códigos de respaldo ──

const RC_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const hashCode = (code: string) => createHash('sha256').update(cleanCode(code).toLowerCase()).digest('hex')

/** 8 códigos nuevos "k7pq-x9wm" (los anteriores dejan de servir); se muestran una sola vez */
export async function newRecoveryCodes(userId: string): Promise<string[]> {
  const block = () => Array.from({ length: 4 }, () => RC_ALPHABET[randomInt(RC_ALPHABET.length)]).join('')
  const codes = Array.from({ length: 8 }, () => `${block()}-${block()}`)
  await prisma.$transaction([
    prisma.adminRecoveryCode.deleteMany({ where: { userId } }),
    prisma.adminRecoveryCode.createMany({ data: codes.map((c) => ({ userId, codeHash: hashCode(c) })) }),
  ])
  return codes
}

// ── Login ──

/**
 * Segundo paso: un código de la app (6 dígitos) o uno de respaldo. Gasta lo que use, sin carreras:
 * el paso de la app solo avanza si es mayor que el último, y un código de respaldo solo se marca una vez.
 */
export async function verifySecondFactor(user: Pick<AdminUser, 'id' | 'twoFactorSecret' | 'twoFactorAt'>, input: string): Promise<'app' | 'recovery' | null> {
  if (!user.twoFactorAt) return null
  const code = cleanCode(input)
  if (/^\d{6}$/.test(code)) {
    const secret = unseal(user.twoFactorSecret)
    const step = secret ? matchStep(secret, code) : null
    if (step === null) return null
    const { count } = await prisma.adminUser.updateMany({
      where: { id: user.id, OR: [{ twoFactorLastStep: null }, { twoFactorLastStep: { lt: step } }] },
      data: { twoFactorLastStep: step },
    })
    return count ? 'app' : null
  }
  const { count } = await prisma.adminRecoveryCode.updateMany({ where: { userId: user.id, codeHash: hashCode(code), usedAt: null }, data: { usedAt: new Date() } })
  return count ? 'recovery' : null
}

/** Quita el 2FA (clave y códigos); quien lo llame decide si cierra sesiones */
export async function clearTwoFactor(userId: string) {
  await prisma.$transaction([
    prisma.adminRecoveryCode.deleteMany({ where: { userId } }),
    prisma.adminUser.update({ where: { id: userId }, data: { twoFactorSecret: null, twoFactorAt: null, twoFactorLastStep: null } }),
  ])
}
