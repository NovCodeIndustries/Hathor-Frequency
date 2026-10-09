import type { Artist, ArtistPattern, ArtistSocial, MediaItem } from './types'
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
const placeholderVideos = (n: number): MediaItem[] =>
  Array.from({ length: n }, (_, i) => ({ title: `[VIDEO ${i + 1}: TÍTULO]`, detail: '[DURACIÓN]' }))
const placeholderPhotos = (n: number): MediaItem[] =>
  Array.from({ length: n }, (_, i) => ({ title: `[FOTO ${i + 1}]`, detail: '[CRÉDITO]' }))

/** Artista con bio, redes y galería de marcador (n videos / n fotos) */
function artist(
  code: string,
  side: 'A' | 'B',
  name: string,
  genre: string,
  pattern: ArtistPattern,
  extra: { videos: number; photos: number; quote?: string },
): Artist {
  return {
    code,
    side,
    name,
    genre,
    pattern,
    href: '/artistas',
    bio: `[BIO DE ${name.toUpperCase()}: de dónde viene, cómo llegó al estudio y qué buscaba en su sonido.]`,
    quote: extra.quote,
    socials: placeholderSocials,
    videos: placeholderVideos(extra.videos),
    photos: placeholderPhotos(extra.photos),
  }
}

// TODO: catálogo real. Salvo Sofía M., RALO y Luna K., los nombres son provisionales;
// el número de videos/fotos (1–10) se eligió al azar para probar la galería.
export const artists: Artist[] = [
  artist('A1', 'A', 'Sofía M.', 'R&B · Soul', 'circles', { videos: 2, photos: 6, quote: testimonial.quote }),
  artist('A2', 'A', 'RALO', 'Hip-Hop · Trap', 'diagonals', { videos: 9, photos: 9 }),
  artist('A3', 'A', 'Los Ecos', 'Rock · Alternativo', 'waves', { videos: 2, photos: 4 }),
  artist('A4', 'A', 'Coral Norte', 'Indie · Dream pop', 'waves', { videos: 10, photos: 10 }),
  artist('A5', 'A', 'Kai Ríos', 'Reggaetón · Urbano', 'bars', { videos: 9, photos: 7 }),
  artist('A6', 'A', 'Las Furias', 'Punk · Garage', 'grid', { videos: 10, photos: 9 }),
  artist('A7', 'A', 'Teo Salas', 'Jazz · Neo-soul', 'circles', { videos: 8, photos: 10 }),
  artist('A8', 'A', 'Brisa', 'Pop · Electrónico', 'diagonals', { videos: 8, photos: 4 }),
  artist('A9', 'A', 'Ruido Blanco', 'Post-rock · Instrumental', 'triangles', { videos: 1, photos: 10 }),
  artist('A10', 'A', 'Valentina Cruz', 'Regional · Norteño', 'waves', { videos: 2, photos: 2 }),
  artist('A11', 'A', 'Aurora 9', 'Shoegaze · Alternativo', 'bars', { videos: 5, photos: 2 }),
  artist('A12', 'A', 'Don Ciro', 'Cumbia · Tropical', 'grid', { videos: 8, photos: 1 }),
  artist('A13', 'A', 'Selva Negra', 'Metal · Progresivo', 'circles', { videos: 8, photos: 6 }),
  artist('B1', 'B', 'Luna K.', 'Pop · Indie', 'triangles', { videos: 4, photos: 7 }),
  artist('B2', 'B', 'Mara V.', 'Folk · Cantautora', 'bars', { videos: 5, photos: 6 }),
  artist('B3', 'B', 'NÉBULA', 'Electrónica · Synth-pop', 'grid', { videos: 6, photos: 7 }),
  artist('B4', 'B', 'Iza Montes', 'Bolero · Trova', 'diagonals', { videos: 9, photos: 2 }),
  artist('B5', 'B', 'Los Faros', 'Surf · Rock', 'triangles', { videos: 6, photos: 2 }),
  artist('B6', 'B', 'MÍA', 'R&B · Alternativo', 'waves', { videos: 9, photos: 9 }),
  artist('B7', 'B', 'Polo Sur', 'Lo-fi · Beats', 'bars', { videos: 5, photos: 5 }),
  artist('B8', 'B', 'Camila Rey', 'Pop · Balada', 'grid', { videos: 8, photos: 3 }),
  artist('B9', 'B', 'Neón 84', 'Synthwave · Retro', 'circles', { videos: 10, photos: 5 }),
  artist('B10', 'B', 'Rafa Luna', 'Ska · Fusión', 'diagonals', { videos: 1, photos: 6 }),
  artist('B11', 'B', 'Duna', 'Ambient · Experimental', 'triangles', { videos: 6, photos: 8 }),
  artist('B12', 'B', 'Hermanos Vega', 'Son · Huapango', 'waves', { videos: 7, photos: 2 }),
  artist('B13', 'B', 'Kalma', 'Indie · Folk', 'bars', { videos: 7, photos: 10 }),
  { code: 'B14', side: 'B', name: 'Tu banda', genre: 'Reserva tu sesión', pattern: 'add', href: '/reservar', cta: true },
]
