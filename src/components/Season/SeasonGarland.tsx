import type { Season } from '../../data/seasons'
import { Glyph } from '../Ufo/seasonArt'
import './Season.css'

/** Piezas suficientes para cubrir pantallas anchas; lo que sobra se recorta */
const COUNT = 48

/**
 * Adorno fijo bajo el menú durante la temporada (papel picado, luces, confeti o glifos).
 * Decorativo: no recibe clics ni lo leen los lectores de pantalla.
 */
export function SeasonGarland({ season, top = false }: { season: Season; top?: boolean }) {
  const { kind, glyph, colors } = season.page.garland
  return (
    <div className={`hf-garland hf-garland--${kind} ${top ? 'hf-garland--top' : ''}`} aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => {
        const color = colors[i % colors.length]
        if (kind === 'papel') {
          return (
            <svg key={i} className="hf-garland__flag" width="40" height="28" viewBox="0 0 40 28">
              <path d="M3 0 H37 V20 L20 27 L3 20Z" fill={color} />
              <circle cx="20" cy="10" r="3" fill="#000" fillOpacity=".35" />
            </svg>
          )
        }
        if (kind === 'lights') {
          return <span key={i} className="hf-garland__bulb" style={{ background: color, boxShadow: `0 0 8px ${color}`, animationDelay: `${-(i % 3) * 0.3}s` }} />
        }
        if (kind === 'confetti') {
          return <span key={i} className="hf-garland__bit" style={{ background: color, transform: `rotate(${(i * 37) % 180}deg)`, marginTop: (i * 7) % 12 }} />
        }
        return (
          <span key={i} className="hf-garland__glyph" style={{ marginTop: i % 2 ? 8 : 2 }}>
            <Glyph name={glyph ?? 'star'} size={14} color={color} />
          </span>
        )
      })}
    </div>
  )
}
