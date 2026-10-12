import { prisma } from '../db'
import { todayISO } from './dates'

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/**
 * Quién del equipo (usuarios del panel) cumple años hoy, en hora de CDMX: "Nombre Apellido".
 * Quien nació un 29 de febrero lo festeja el 28 en los años que no son bisiestos.
 * La web solo recibe estos nombres, nunca las fechas ni la edad.
 */
export async function birthdaysToday(): Promise<string[]> {
  const [y, m, d] = todayISO().split('-').map(Number)
  const users = await prisma.adminUser.findMany({
    where: { birthDate: { not: null } },
    select: { firstName: true, lastName: true, name: true, birthDate: true },
    orderBy: { createdAt: 'asc' },
  })
  return users
    .filter(({ birthDate }) => {
      const bm = birthDate!.getUTCMonth() + 1
      const bd = birthDate!.getUTCDate()
      if (bm === 2 && bd === 29 && !isLeap(y)) return m === 2 && d === 28
      return bm === m && bd === d
    })
    .map((u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name)
}
