/** Zona del estudio: "hoy" y "pasado" se calculan con la hora de CDMX */
export const STUDIO_TZ = 'America/Mexico_City'

/** Hoy en CDMX, "YYYY-MM-DD" */
export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_TZ }).format(new Date())

/** "YYYY-MM-DD" → Date para columnas @db.Date (medianoche UTC) */
export const dateFromISO = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** Columna @db.Date → "YYYY-MM-DD" */
export const isoFromDate = (d: Date) => d.toISOString().slice(0, 10)

/** Primer día del mes y primer día del siguiente, para "YYYY-MM" */
export function monthRange(ym: string): { from: Date; to: Date } {
  const [y, m] = ym.split('-').map(Number)
  return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) }
}
