import type { Artist } from './types'

export const artistsIntro =
  'Bandas y solistas que grabaron, mezclaron y lanzaron su música con nosotros.'

export const sides = {
  A: { label: 'Lado A', speed: '33⅓' },
  B: { label: 'Lado B', speed: '45' },
} as const

export const artists: Artist[] = [
  { code: 'A1', side: 'A', name: 'Sofía M.', genre: 'R&B · Soul', pattern: 'circles', href: '/artistas' },
  { code: 'A2', side: 'A', name: 'RALO', genre: 'Hip-Hop · Trap', pattern: 'diagonals', href: '/artistas' },
  { code: 'B1', side: 'B', name: 'Luna K.', genre: 'Pop · Indie', pattern: 'triangles', href: '/artistas' },
  { code: 'B2', side: 'B', name: 'Tu banda', genre: 'Reserva tu sesión', pattern: 'add', href: '/reservar', cta: true },
]
