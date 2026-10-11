/**
 * Horas en formato de 12 horas para todo el sitio y el panel: "15:00" → "3:00 p. m.".
 * En la base y en la API las horas siguen en 24 h ("HH:MM"); esto es solo para mostrarlas.
 * Lleva espacios de no separación para que "p. m." no se parta en dos líneas.
 */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Hora local de una fecha en 12 h ("6:05 p. m.") */
export const formatClock = (d: Date) => formatTime(`${d.getHours()}:${d.getMinutes()}`)
