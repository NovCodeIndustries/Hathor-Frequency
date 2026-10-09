import { useSeason } from '../../lib/useSeason'
import { Glyph } from '../Ufo/seasonArt'

/** Glifo de la temporada activa (o nada) para acompañar títulos y etiquetas de los modales */
export function SeasonBadge({ size = 18, className }: { size?: number; className?: string }) {
  const season = useSeason()
  if (!season) return null
  return (
    <span className={className} aria-hidden="true" style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
      <Glyph name={season.page.logo} size={size} />
    </span>
  )
}
