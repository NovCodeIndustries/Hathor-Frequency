interface VinylRingsProps {
  /** Tamaño del viewBox (cuadrado) */
  size: number
  radii: number[]
  strokeOpacity?: number
  /** Círculo central relleno + punto negro */
  center?: { r: number; opacity: number; dot?: number }
  /** Anillo extra con opacidad propia */
  extra?: { r: number; opacity: number }
  /** Arco de reflejo (atributo d) */
  arc?: { d: string; opacity: number; width?: number }
  className?: string
}

export function VinylRings({ size, radii, strokeOpacity = 0.6, center, extra, arc, className }: VinylRingsProps) {
  const c = size / 2
  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {radii.map((r) => (
        <circle key={r} cx={c} cy={c} r={r} stroke="#F2C94C" strokeOpacity={strokeOpacity} />
      ))}
      {extra && <circle cx={c} cy={c} r={extra.r} stroke="#F2C94C" strokeOpacity={extra.opacity} />}
      {arc && <path d={arc.d} stroke="#F2C94C" strokeOpacity={arc.opacity} strokeWidth={arc.width ?? 2} />}
      {center && <circle cx={c} cy={c} r={center.r} fill="#F2C94C" fillOpacity={center.opacity} />}
      {center?.dot && <circle cx={c} cy={c} r={center.dot} fill="#000" />}
    </svg>
  )
}
