interface KnobProps {
  angle: number
  size: number
  /** Aro interior (perillas grandes del rack) */
  inner?: boolean
}

/** Perilla dorada decorativa (el nombre va aparte, en texto) */
export function Knob({ angle, size, inner = false }: KnobProps) {
  const r = ((angle - 90) * Math.PI) / 180
  const reach = inner ? 13 : 15
  return (
    <svg className="hf-knob" width={size} height={size} viewBox="0 0 46 46" aria-hidden="true" focusable="false">
      <circle cx="23" cy="23" r="20" fill="#0b0b0b" stroke="#444" />
      {inner && <circle cx="23" cy="23" r="14" fill="#1a1a1a" stroke="#333" />}
      <line x1="23" y1="23" x2={23 + Math.cos(r) * reach} y2={23 + Math.sin(r) * reach} stroke="#F2C94C" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
