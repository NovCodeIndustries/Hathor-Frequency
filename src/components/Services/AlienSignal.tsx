import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './AlienSignal.css'

const DURATION = 10_000

interface AlienSignalProps {
  onClose: () => void
}

/** Pantalla completa con el rostro dorado; se quita sola a los 10 s (o con clic / Escape) */
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
      aria-describedby="hf-alien-text"
      tabIndex={-1}
      onClick={onClose}
      style={{ '--alien-duration': `${DURATION}ms` } as CSSProperties}
    >
      <svg className="hf-alien__rings" viewBox="0 0 1000 1000" aria-hidden="true">
        <g fill="none" stroke="#F2C94C">
          {[490, 430, 370, 310, 250].map((r, i) => (
            <circle key={r} cx="500" cy="500" r={r} strokeOpacity={0.08 + i * 0.05} />
          ))}
        </g>
      </svg>

      <svg className="hf-alien__face" viewBox="0 0 200 240" role="img" aria-label="Rostro de un extraterrestre dorado">
        <defs>
          <linearGradient id="hf-alien-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2C94C" />
            <stop offset="1" stopColor="#B8860B" />
          </linearGradient>
          <radialGradient id="hf-alien-shine" cx="0.35" cy="0.25" r="0.6">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* cabeza */}
        <path
          d="M100 8C162 8 192 58 187 110C182 162 140 216 100 232C60 216 18 162 13 110C8 58 38 8 100 8Z"
          fill="url(#hf-alien-gold)"
        />
        <path
          d="M100 8C162 8 192 58 187 110C182 162 140 216 100 232C60 216 18 162 13 110C8 58 38 8 100 8Z"
          fill="url(#hf-alien-shine)"
        />
        {/* ojos almendrados */}
        <g className="hf-alien__eyes">
          <path d="M40 112C50 88 86 94 92 124C80 142 46 140 40 112Z" fill="#000" />
          <path d="M160 112C150 88 114 94 108 124C120 142 154 140 160 112Z" fill="#000" />
          <ellipse cx="60" cy="110" rx="6" ry="4" fill="#F2C94C" opacity="0.8" />
          <ellipse cx="140" cy="110" rx="6" ry="4" fill="#F2C94C" opacity="0.8" />
        </g>
        {/* nariz y boca */}
        <circle cx="95" cy="166" r="2" fill="#000" opacity="0.7" />
        <circle cx="105" cy="166" r="2" fill="#000" opacity="0.7" />
        <path d="M86 192Q100 199 114 192" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      </svg>

      <div className="hf-alien__copy">
        <p className="hf-alien__eyebrow">Transmisión entrante · CH 01–05</p>
        <h2 id="hf-alien-title" className="hf-alien__title">Señal recibida.</h2>
        <p id="hf-alien-text" className="hf-alien__text">
          Encontraste la frecuencia correcta. Hasta en otros planetas, todo suena mejor cuando pasa por la misma
          consola.
        </p>
      </div>

      <span className="hf-alien__timer" aria-hidden="true" />
    </div>,
    document.body,
  )
}
