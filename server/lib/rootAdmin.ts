import { hashPassword } from '../auth'
import { prisma } from '../db'

export const ROOT_EMAIL = (process.env.ROOT_ADMIN_EMAIL ?? 'hathor@hathorfrequency.mx').trim().toLowerCase()

/**
 * El usuario principal siempre existe: al arrancar la API se crea si falta (con ROOT_ADMIN_PASSWORD de .env)
 * y se asegura que sea el principal. Si ya existe no se toca su contraseña (se puede cambiar desde el panel).
 */
export async function ensureRootAdmin() {
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email: ROOT_EMAIL } })
    if (existing) {
      if (!existing.isRoot) await prisma.adminUser.update({ where: { id: existing.id }, data: { isRoot: true } })
    } else {
      const password = process.env.ROOT_ADMIN_PASSWORD
      if (!password) {
        console.warn(`[admin] Falta ROOT_ADMIN_PASSWORD en .env: no se pudo crear ${ROOT_EMAIL}`)
        return
      }
      await prisma.adminUser.create({
        data: { email: ROOT_EMAIL, name: process.env.ROOT_ADMIN_NAME?.trim() || 'Hathor', firstName: process.env.ROOT_ADMIN_NAME?.trim() || 'Hathor', passwordHash: await hashPassword(password), isRoot: true },
      })
      console.info(`[admin] Usuario principal creado: ${ROOT_EMAIL}`)
    }
    // Solo hay un principal
    await prisma.adminUser.updateMany({ where: { isRoot: true, email: { not: ROOT_EMAIL } }, data: { isRoot: false } })
  } catch (err) {
    console.error('[admin] No se pudo asegurar el usuario principal:', (err as Error).message)
  }
}
