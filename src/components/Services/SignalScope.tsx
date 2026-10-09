/** Puntos de la onda y semilla fija: el ruido es el mismo en cada render */
const WIDTH = 1280
const STEP = 16

function wavePath(noise: number) {
  let seed = 7
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280 - 0.5
  }
  let d = 'M0 48'
  for (let x = 0; x <= WIDTH; x += STEP) {
    const clean = Math.sin((x / WIDTH) * Math.PI * 8) * 26
    const y = 48 + clean * (0.35 + 0.65 * (1 - noise)) + rnd() * 70 * noise
    d += ` L${x} ${y.toFixed(1)}`
  }
  return d
}

/**
 * Osciloscopio sobre la consola (F6): la onda empieza caótica y se limpia
 * con cada fader que llega a su posición del easter egg.
 */
export function SignalScope({ count, total }: { count: number; total: number }) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="hf-scope-bar" aria-hidden="true">
      <svg viewBox={`0 0 ${WIDTH} 96`} preserveAspectRatio="none">
        <line x1="0" y1="48" x2={WIDTH} y2="48" stroke="#F2C94C" strokeOpacity="0.12" />
        <path className="hf-scope-bar__wave" d={wavePath((total - count) / total)} fill="none" stroke="#F2C94C" strokeWidth="2" />
      </svg>
      <span className="hf-scope-bar__left">Frecuencia desconocida</span>
      <span className="hf-scope-bar__right">Sintonizando · {pct}%</span>
    </div>
  )
}
