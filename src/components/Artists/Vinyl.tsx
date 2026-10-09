import { useId, type CSSProperties } from 'react'

interface VinylProps {
  /** Variante móvil: menos surcos y etiqueta más grande */
  compact?: boolean
  /** 0–1: el disco gira según el avance de la lista (sin giro continuo) */
  progress?: number
  className?: string
}

/** Vueltas que da el disco al recorrer toda la lista */
const TURNS = 3

export function Vinyl({ compact = false, progress, className }: VinylProps) {
  const gradId = useId()
  const step = compact ? 16 : 12
  const grooves: number[] = []
  for (let r = 200; r >= 104; r -= step) grooves.push(r)
  const size = compact ? 280 : 440

  return (
    <svg
      className={className}
      role="img"
      aria-label="Disco de vinil con la etiqueta de Hathor Frequency"
      width={size}
      height={size}
      viewBox="0 0 440 440"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2C94C" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      {/* Gira el <g> (no el <svg>) para no agrandar su caja de layout */}
      <g
        className={`hf-vinyl__spin ${progress === undefined ? '' : 'is-synced'}`}
        style={progress === undefined ? undefined : ({ '--vinyl-rot': `${progress * TURNS * 360}deg` } as CSSProperties)}
      >
      <circle cx="220" cy="220" r="216" fill="#0a0a0a" stroke="#333" />
      <g fill="none" stroke="#F2C94C" strokeOpacity="0.18">
        {grooves.map((r) => (
          <circle key={r} cx="220" cy="220" r={r} />
        ))}
      </g>
      <path
        d="M 220 20 A 200 200 0 0 1 400 140"
        fill="none"
        stroke="#F2C94C"
        strokeOpacity="0.5"
        strokeWidth={compact ? 3 : 2}
      />
      <circle cx="220" cy="220" r="80" fill={`url(#${gradId})`} />
      <text x="220" y="214" textAnchor="middle" fontFamily="Cinzel, serif" fontSize={compact ? 24 : 22} fontWeight="700" letterSpacing="5" fill="#000">
        HATHOR
      </text>
      <text x="220" y={compact ? 240 : 238} textAnchor="middle" fontFamily="Cinzel, serif" fontSize={compact ? 12 : 11} letterSpacing="4" fill="#000">
        FREQUENCY
      </text>
      <circle cx="220" cy="220" r="5" fill="#000" />
      </g>
    </svg>
  )
}
