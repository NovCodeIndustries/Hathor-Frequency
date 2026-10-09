import { useState } from 'react'
import { currentSeason, type Season } from '../data/seasons'

/** Temporada activa al cargar la página (no cambia mientras está abierta) */
export function useSeason(): Season | null {
  const [season] = useState(currentSeason)
  return season
}
