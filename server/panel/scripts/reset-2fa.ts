/**
 * Quita la verificación en dos pasos (2FA) de alguien que perdió su teléfono y sus códigos de respaldo
 * (sobre todo del usuario principal, que no tiene a quién pedírselo en el panel). Cierra sus sesiones;
 * al volver a entrar la activa de nuevo (si es Admin, es lo primero que le pide el panel).
 *   npm run admin:reset-2fa
 *   docker compose exec panel npm run admin:reset-2fa
 */
import 'dotenv/config'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { normalizeUsername } from '../../../src/data/staff'
import { prisma } from '../../shared/db'
import { clearTwoFactor } from '../lib/twoFactor'

const rl = createInterface({ input: stdin, output: stdout })
const fallback = process.env.ROOT_ADMIN_USERNAME ?? ''
const username = normalizeUsername((await rl.question(`Usuario${fallback ? ` (Enter = ${fallback})` : ''}: `)) || fallback)
const user = await prisma.adminUser.findUnique({ where: { username } })
if (!user) {
  console.error(`No existe el usuario "${username}".`)
  process.exit(1)
}
if (!user.twoFactorAt && !user.twoFactorSecret) {
  console.info(`${user.name} (${user.username}) no tiene 2FA activo. Nada que hacer.`)
  process.exit(0)
}
const sure = (await rl.question(`¿Quitar el 2FA de ${user.name} (${user.username}) y cerrar sus sesiones? (s/N): `)).trim().toLowerCase()
rl.close()
if (sure !== 's' && sure !== 'si' && sure !== 'sí') {
  console.info('Cancelado.')
  process.exit(0)
}
await clearTwoFactor(user.id)
await prisma.adminSession.deleteMany({ where: { userId: user.id } })
console.info(`✔ 2FA restablecido: ${user.name} (${user.username}). Al entrar lo activa de nuevo.`)
await prisma.$disconnect()
process.exit(0)
