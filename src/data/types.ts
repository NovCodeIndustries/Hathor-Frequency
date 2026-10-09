export type Point = readonly [number, number]

export interface Service {
  ch: string
  name: string
  description: string
  /** Nivel inicial del fader, 0–100 (el usuario lo puede mover) */
  level: number
  /** Extremo (x2, y2) de la línea de cada perilla, viewBox 34 */
  knobs: readonly [Point, Point]
}

export type ArtistPattern = 'circles' | 'diagonals' | 'triangles' | 'add'

export interface Artist {
  code: string
  side: 'A' | 'B'
  name: string
  genre: string
  pattern: ArtistPattern
  href: string
  /** Fila de llamada a la acción ("Tu banda") */
  cta?: boolean
}

export interface Stat {
  value: string
  label: string
}

export interface NavLink {
  label: string
  href: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface Package {
  n: string
  name: string
  /** Etiqueta corta en la portada ("Para empezar") */
  tag: string
  /** Precio en MXN, ya formateado ("$4,500") */
  price: string
  /** Una línea para la card */
  short: string
  /** Descripción completa (panel de detalle) */
  description: string
  includes: string[]
  /** Tiempo de entrega y número de sesiones */
  delivery: string
  sessions: string
}
