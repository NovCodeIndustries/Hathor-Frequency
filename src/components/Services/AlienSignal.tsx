import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { GoldText } from '../shared/GoldText'
import './AlienSignal.css'

const DURATION = 10_000

/** Radios de los surcos del vinil (con dos bandas lisas entre pistas) */
const GROOVES = [124, 130, 136, 142, 148, 154, 166, 172, 178, 184, 190, 196, 208, 214, 220]

interface AlienSignalProps {
  onClose: () => void
}

/**
 * Easter egg "Contacto establecido" (estilo A3 · Osciloscopio, rostro X5 · Vinil girando).
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

        {/* Vinil girando (X5) con el rostro fijo en la etiqueta y el brazo de la tornamesa */}
        <svg
          className="hf-scope__vinyl"
          viewBox="0 0 570 460"
          role="img"
          aria-label="Disco de vinil girando con el rostro de un extraterrestre dorado en la etiqueta central"
        >
          <defs>
            <path id="hf-vinyl-label" d="M230 230m-100 0a100 100 0 1 1 200 0a100 100 0 1 1 -200 0" />
            <pattern id="hf-scope-sine" width="20" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 3.5Q5 0 10 3.5T20 3.5" fill="none" stroke="#F2C94C" strokeWidth="1" />
            </pattern>
          </defs>

          <circle cx="230" cy="230" r="228" fill="#0a0a0a" stroke="#B8860B" strokeWidth="1.5" />

          <g className="hf-scope__spin">
            <g fill="none" stroke="#F2C94C" strokeOpacity="0.16" strokeWidth="0.8">
              {GROOVES.map((r) => (
                <circle key={r} cx="230" cy="230" r={r} />
              ))}
            </g>
            <path d="M230 230L206 4L254 4Z" fill="#F2C94C" fillOpacity="0.1" />
            <path d="M230 230L206 456L254 456Z" fill="#F2C94C" fillOpacity="0.1" />
            <circle cx="230" cy="230" r="114" fill="#050505" stroke="#F2C94C" strokeWidth="1.5" />
            <circle cx="230" cy="230" r="88" fill="none" stroke="#F2C94C" strokeOpacity="0.4" strokeWidth="0.8" />
            <text className="hf-scope__label" fill="#F2C94C">
              <textPath href="#hf-vinyl-label" textLength="610" lengthAdjust="spacing">
                HATHOR FREQUENCY · LADO A · 33⅓ RPM · HATHOR FREQUENCY · LADO A · 33⅓ RPM ·
              </textPath>
            </text>
          </g>

          <g className="hf-scope__face" transform="translate(167.5 155) scale(0.625)">
            <path
              d="M100 8C162 8 192 58 187 110C182 162 140 216 100 232C60 216 18 162 13 110C8 58 38 8 100 8Z"
              fill="url(#hf-scope-sine)"
              stroke="#F2C94C"
              strokeWidth="3"
            />
            <path d="M40 112C50 88 86 94 92 124C80 142 46 140 40 112Z" fill="#050505" stroke="#F2C94C" strokeWidth="3" />
            <path d="M160 112C150 88 114 94 108 124C120 142 154 140 160 112Z" fill="#050505" stroke="#F2C94C" strokeWidth="3" />
          </g>

          {/* Brazo: pivote arriba a la derecha, aguja sobre los surcos de afuera */}
          <circle cx="540" cy="50" r="22" fill="#0a0a0a" stroke="#B8860B" strokeWidth="1.5" />
          <circle cx="540" cy="50" r="7" fill="#F2C94C" />
          <path d="M540 50L510 220L426 284" fill="none" stroke="#bbb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="406" y="272" width="30" height="16" rx="2" fill="#F2C94C" transform="rotate(-37 421 280)" />
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
