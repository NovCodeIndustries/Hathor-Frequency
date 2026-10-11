import { useState } from 'react'
import { currentSeason, type Season } from '../data/seasons'
import { useModule } from './siteModules'

/** Temporada activa al cargar la página (no cambia mientras está abierta) */
export function useSeason(): Season | null {
  const [season] = useState(currentSeason)
  // Apagadas en el panel · Sitio: el sitio se ve como en cualquier otro mes
  return useModule('global.seasons') ? season : null
}
