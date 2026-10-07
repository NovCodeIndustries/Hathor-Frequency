/** Utilidades de fecha para el calendario de Reservar (semana de lunes a domingo, es-MX) */

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const
export const WEEKDAYS_MIN = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'] as const
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

export interface YearMonth {
  year: number
  month: number // 0-11
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 0 = lunes … 6 = domingo */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

/** Celdas del mes: `null` para los huecos antes del día 1 */
export function monthCells({ year, month }: YearMonth): (Date | null)[] {
  const first = new Date(year, month, 1)
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: mondayIndex(first) }, () => null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  return cells
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "Noviembre 2026" */
export function monthTitle({ year, month }: YearMonth): string {
  return `${capitalize(MONTHS[month])} ${year}`
}

/** "Martes 17 de noviembre" */
export function dayLabel(d: Date): string {
  return `${WEEKDAYS[mondayIndex(d)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** "2026-11-17" (fecha local, sin zona horaria) */
export function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
