import type { Season } from '../../data/seasons'
import { Glyph } from '../Ufo/seasonArt'
import './Season.css'

/** Posiciones (en %) de las partículas del Home */
const SPOTS = [
  { x: 8, y: 22 }, { x: 18, y: 64 }, { x: 30, y: 12 }, { x: 72, y: 18 },
  { x: 84, y: 58 }, { x: 92, y: 30 }, { x: 62, y: 80 }, { x: 40, y: 86 },
]

/** Partículas de temporada que flotan (o caen, si es nieve) detrás del contenido del Home */
export function SeasonParticles({ season }: { season: Season }) {
  const falling = season.page.particle === 'snow'
  return (
    <div className="hf-season-particles" aria-hidden="true">
      {SPOTS.map((p, i) => (
        <span
          key={i}
          className={falling ? 'hf-season-particles__fall' : 'hf-season-particles__float'}
          style={{ left: `${p.x}%`, top: falling ? '-5%' : `${p.y}%`, animationDelay: `${-i * 0.9}s` }}
        >
          <Glyph name={season.page.particle} size={i % 2 ? 18 : 24} color={season.page.caps[i % season.page.caps.length]} />
        </span>
      ))}
    </div>
  )
}
