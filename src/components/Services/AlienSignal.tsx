import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { GoldText } from '../shared/GoldText'
import './AlienSignal.css'

const DURATION = 10_000

interface AlienSignalProps {
  onClose: () => void
}

/**
 * Easter egg "Contacto establecido" (estilo A3 · Osciloscopio).
 * Pantalla completa; se quita sola a los 10 s (o con clic / Escape).
 */
export function AlienSignal({ onClose }: AlienSignalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(onClose, DURATION)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="hf-alien"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hf-alien-title"
      aria-describedby="hf-alien-log"
      tabIndex={-1}
      onClick={onClose}
      style={{ '--alien-duration': `${DURATION}ms` } as CSSProperties}
    >
      {/* Pantalla del osciloscopio */}
      <div className="hf-scope">
        <svg className="hf-scope__grid" aria-hidden="true">
          <defs>
            <pattern id="hf-scope-grid" width="52" height="52" patternUnits="userSpaceOnUse">
              <path d="M52 0H0V52" fill="none" stroke="#F2C94C" strokeOpacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hf-scope-grid)" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#F2C94C" strokeOpacity="0.18" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#F2C94C" strokeOpacity="0.18" />
        </svg>

        <svg className="hf-scope__wave" viewBox="0 0 1040 520" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 400C40 400 60 360 100 360S160 440 200 440 260 330 300 330 360 470 400 470 460 300 520 300 580 470 640 470 700 330 740 330 800 440 840 440 900 360 940 360 1000 400 1040 400"
            fill="none"
            stroke="#F2C94C"
            strokeOpacity="0.5"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <svg className="hf-scope__face" viewBox="0 0 200 240" role="img" aria-label="Rostro de un extraterrestre trazado con ondas doradas">
          <defs>
            <pattern id="hf-scope-sine" width="20" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 3.5Q5 0 10 3.5T20 3.5" fill="none" stroke="#F2C94C" strokeWidth="1" />
            </pattern>
          </defs>
          <path
            d="M100 8C162 8 192 58 187 110C182 162 140 216 100 232C60 216 18 162 13 110C8 58 38 8 100 8Z"
            fill="url(#hf-scope-sine)"
            stroke="#F2C94C"
            strokeWidth="2"
          />
          <path d="M40 112C50 88 86 94 92 124C80 142 46 140 40 112Z" fill="#050505" stroke="#F2C94C" strokeWidth="2" />
          <path d="M160 112C150 88 114 94 108 124C120 142 154 140 160 112Z" fill="#050505" stroke="#F2C94C" strokeWidth="2" />
          <circle className="hf-scope__pupil" cx="64" cy="114" r="4" fill="#F2C94C" />
          <circle className="hf-scope__pupil" cx="136" cy="114" r="4" fill="#F2C94C" />
          <path d="M82 192Q100 202 118 192" fill="none" stroke="#050505" strokeWidth="5" strokeLinecap="round" />
          <path d="M82 192Q100 202 118 192" fill="none" stroke="#F2C94C" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <span className="hf-scope__sweep" aria-hidden="true" />

        <div className="hf-scope__readout hf-scope__readout--tl" aria-hidden="true">
          <span>CH 01–05</span>
          <span className="hf-scope__muted">Freq 432 Hz</span>
        </div>
        <div className="hf-scope__readout hf-scope__readout--tr" aria-hidden="true">
          <span className="hf-scope__led" />
          Señal 100%
        </div>
        <div className="hf-scope__readout hf-scope__readout--bl hf-scope__muted" aria-hidden="true">
          Origen · desconocido
        </div>
      </div>

      {/* Mensaje */}
      <div className="hf-alien__copy">
        <h2 id="hf-alien-title" className="hf-alien__title">
          Contacto <GoldText strong>establecido.</GoldText>
        </h2>
        <div id="hf-alien-log" className="hf-alien__log">
          <p><span aria-hidden="true">›</span> Decodificando la mezcla… 100%</p>
          <p><span aria-hidden="true">›</span> Patrón 1·2·3·2·1 reconocido</p>
          <p className="hf-alien__msg"><span aria-hidden="true">›</span> Mensaje: “Suena increíble desde aquí.”</p>
          <p className="hf-alien__hint">Se cierra en 10 s · clic o Esc para cerrar</p>
        </div>
      </div>

      <span className="hf-alien__timer" aria-hidden="true" />
    </div>,
    document.body,
  )
}
