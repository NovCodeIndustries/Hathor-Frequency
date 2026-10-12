import { hashPassword } from '../auth'
import { prisma } from '../../shared/db'

import { normalizeUsername } from '../../../src/data/staff'

/** Usuario del principal: ROOT_ADMIN_USERNAME en .env (o, por compatibilidad, lo de antes de la @ de ROOT_ADMIN_EMAIL) */
export const ROOT_USERNAME = normalizeUsername(process.env.ROOT_ADMIN_USERNAME || process.env.ROOT_ADMIN_EMAIL || 'hathor')

/**
 * El usuario principal siempre existe: al arrancar la API se crea si falta (con ROOT_ADMIN_PASSWORD de .env)
 * y se asegura que sea el principal. Si ya existe no se toca su contraseña (se puede cambiar desde el panel).
 */
export async function ensureRootAdmin() {
  try {
    const existing = await prisma.adminUser.findUnique({ where: { username: ROOT_USERNAME } })
    if (existing) {
      if (!existing.isRoot) await prisma.adminUser.update({ where: { id: existing.id }, data: { isRoot: true } })
    } else {
      const password = process.env.ROOT_ADMIN_PASSWORD
      if (!password) {
        console.warn(`[admin] Falta ROOT_ADMIN_PASSWORD en .env: no se pudo crear ${ROOT_USERNAME}`)
        return
      }
      await prisma.adminUser.create({
        data: { username: ROOT_USERNAME, name: process.env.ROOT_ADMIN_NAME?.trim() || 'Hathor', firstName: process.env.ROOT_ADMIN_NAME?.trim() || 'Hathor', passwordHash: await hashPassword(password), isRoot: true },
      })
      console.info(`[admin] Usuario principal creado: ${ROOT_USERNAME}`)
    }
    // Solo hay un principal
    await prisma.adminUser.updateMany({ where: { isRoot: true, username: { not: ROOT_USERNAME } }, data: { isRoot: false } })
  } catch (err) {
    console.error('[admin] No se pudo asegurar el usuario principal:', (err as Error).message)
  }
}
