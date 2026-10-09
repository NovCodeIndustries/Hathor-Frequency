/** Escala de consola: etiqueta en dB y el nivel del fader (0–100) donde va */
export const DB_MARKS: { label: string; level: number; minor?: boolean }[] = [
  { label: '+10', level: 100 },
  { label: '+5', level: 87, minor: true },
  { label: '0', level: 75 },
  { label: '-5', level: 62, minor: true },
  { label: '-10', level: 50 },
  { label: '-20', level: 37 },
  { label: '-30', level: 25, minor: true },
  { label: '-40', level: 12, minor: true },
  { label: '-∞', level: 0 },
]

const toNumber = (label: string) => (label === '-∞' ? -60 : parseFloat(label))

/** Convierte el nivel del fader a dB, interpolando entre las marcas ("-7.3 dB") */
export function levelToDb(level: number): string {
  if (level <= 0) return '-∞ dB'
  for (let i = 0; i < DB_MARKS.length - 1; i++) {
    const hi = DB_MARKS[i]
    const lo = DB_MARKS[i + 1]
    if (level <= hi.level && level >= lo.level) {
      const a = toNumber(hi.label)
      const b = toNumber(lo.label)
      const db = b + ((a - b) * (level - lo.level)) / (hi.level - lo.level)
      return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`
    }
  }
  return '+10.0 dB'
}
