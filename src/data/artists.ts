import type { Artist, ArtistSocial, MediaItem } from './types'
import { testimonial } from './site'

export const artistsIntro =
  'Bandas y solistas que grabaron, mezclaron y lanzaron su música con nosotros.'

export const sides = {
  A: { label: 'Lado A', speed: '33⅓' },
  B: { label: 'Lado B', speed: '45' },
} as const

// TODO: links reales de cada artista (hoy apuntan a la página principal de cada red)
const placeholderSocials: ArtistSocial[] = [
  { platform: 'instagram', href: 'https://instagram.com/' },
  { platform: 'spotify', href: 'https://open.spotify.com/' },
  { platform: 'youtube', href: 'https://youtube.com/' },
  { platform: 'tiktok', href: 'https://tiktok.com/' },
]

// TODO: videos (embed) y fotos (src) reales; sin src/embed se muestra un marcador
const placeholderVideos: MediaItem[] = [1, 2, 3].map((n) => ({ title: `[VIDEO ${n}: TÍTULO]`, detail: '[DURACIÓN]' }))
const placeholderPhotos: MediaItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({ title: `[FOTO ${n}]`, detail: '[CRÉDITO]' }))

// TODO: bios reales (los [..] son marcadores)
export const artists: Artist[] = [
  {
    code: 'A1',
    side: 'A',
    name: 'Sofía M.',
    genre: 'R&B · Soul',
    pattern: 'circles',
    href: '/artistas',
    bio: '[BIO DE SOFÍA M.: de dónde es, cómo llegó al estudio y qué buscaba en su sonido.]',
    quote: testimonial.quote,
    socials: placeholderSocials,
    videos: placeholderVideos,
    photos: placeholderPhotos,
  },
  {
    code: 'A2',
    side: 'A',
    name: 'RALO',
    genre: 'Hip-Hop · Trap',
    pattern: 'diagonals',
    href: '/artistas',
    bio: '[BIO DE RALO: de dónde es, cómo llegó al estudio y qué buscaba en su sonido.]',
    socials: placeholderSocials,
    videos: placeholderVideos,
    photos: placeholderPhotos,
  },
  {
    code: 'B1',
    side: 'B',
    name: 'Luna K.',
    genre: 'Pop · Indie',
    pattern: 'triangles',
    href: '/artistas',
    bio: '[BIO DE LUNA K.: de dónde es, cómo llegó al estudio y qué buscaba en su sonido.]',
    socials: placeholderSocials,
    videos: placeholderVideos,
    photos: placeholderPhotos,
  },
  { code: 'B2', side: 'B', name: 'Tu banda', genre: 'Reserva tu sesión', pattern: 'add', href: '/reservar', cta: true },
]
