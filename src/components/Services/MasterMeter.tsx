/** Colores de LED de consola, de abajo hacia arriba: verde, verde, amarillo, amarillo, rojo */
const LEDS = ['green', 'green', 'yellow', 'yellow', 'red'] as const

/** Canal MASTER (F6): se llena un LED por cada fader en su posición del easter egg */
export function MasterMeter({ count }: { count: number }) {
  return (
    <div className={`hf-master ${count > 0 ? 'is-active' : ''} ${count >= 3 ? 'is-hot' : ''}`}>
      <span className="hf-master__title">Master</span>
      <span className="hf-master__leds" aria-hidden="true">
        {LEDS.map((color, i) => (
          <span key={i} className={`hf-master__led is-${color} ${i < count ? 'is-on' : ''}`} />
        ))}
      </span>
      <span className="hf-master__count" aria-live="polite">
        Señal {count}/{LEDS.length}
      </span>
      <span className="hf-master__hint" aria-hidden="true">
        Ajusta los canales
      </span>
    </div>
  )
}
