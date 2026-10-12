import { prisma } from '../db'
import { todayISO } from './dates'

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** ¿Hoy (CDMX) es el cumpleaños de quien nació en esa fecha? (el 29 de febrero cuenta el 28 en años no bisiestos) */
export function isBirthdayToday(birthDate: Date | null): boolean {
  if (!birthDate) return false
  const [y, m, d] = todayISO().split('-').map(Number)
  const bm = birthDate.getUTCMonth() + 1
  const bd = birthDate.getUTCDate()
  if (bm === 2 && bd === 29 && !isLeap(y)) return m === 2 && d === 28
  return bm === m && bd === d
}

/**
 * Quién del equipo (usuarios del panel) cumple años hoy, en hora de CDMX: "Nombre Apellido".
 * Quien nació un 29 de febrero lo festeja el 28 en los años que no son bisiestos.
 * La web solo recibe estos nombres, nunca las fechas ni la edad.
 */
/** Usuarios del panel que cumplen hoy (CDMX), con su nombre corto "Nombre Apellido" */
export async function birthdayUsersToday(): Promise<{ id: string; name: string; firstName: string }[]> {
  const users = await prisma.adminUser.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, firstName: true, lastName: true, name: true, birthDate: true },
    orderBy: { createdAt: 'asc' },
  })
  return users
    .filter(({ birthDate }) => isBirthdayToday(birthDate))
    .map((u) => ({ id: u.id, name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name, firstName: u.firstName || u.name }))
}

export async function birthdaysToday(): Promise<string[]> {
  return (await birthdayUsersToday()).map((u) => u.name)
}
