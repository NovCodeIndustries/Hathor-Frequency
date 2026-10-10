const STAR = 'M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6Z'

/** Estrella sola (rellena o de contorno) */
export function Star({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg className={`hf-star ${filled ? 'is-on' : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

/** Calificación de solo lectura: 5 estrellas con `rating` rellenas */
export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="hf-stars" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(rating)} size={size} />
      ))}
    </span>
  )
}
