import { formatClock } from './time'

/** Mensaje de la pantalla de mantenimiento cuando el panel no escribe uno */
export const MAINTENANCE_DEFAULT_MESSAGE = 'Estamos afinando el estudio. En un rato volvemos a sonar.'

const DAY_MS = 86_400_000
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Regreso estimado: "hoy a las 6:00 p. m." · "mañana a las 10:00 a. m." · "el 14 de octubre a las 9:00 a. m." */
export function describeReturn(iso: string, now: number): string {
  const d = new Date(iso)
  const days = Math.round((dayStart(d) - dayStart(new Date(now))) / DAY_MS)
  const at = `a las ${formatClock(d)}`
  if (days <= 0) return `hoy ${at}`
  if (days === 1) return `mañana ${at}`
  return `el ${d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} ${at}`
}
