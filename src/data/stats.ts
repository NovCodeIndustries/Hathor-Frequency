import type { Stat } from './types'

export const stats: Stat[] = [
  // Proyectos y Artistas salen de la base (reservas terminadas / artistas publicados)
  { value: '0', label: 'Proyectos', source: 'proyectos' },
  { value: '0', label: 'Artistas', source: 'artistas' },
  { value: '12', label: 'Años', source: 'manual' },
]
