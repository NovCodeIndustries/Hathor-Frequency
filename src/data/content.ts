import { artists, artistsIntro } from './artists'
import { servicePrices, type bookingServices } from './booking'
import { faqs } from './faq'
import { packages, packagesDisclaimer, packagesIntro, packagesNote } from './packages'
import { services, servicesIntro } from './services'
import { slogan, socials, whatsapp } from './site'
import { stats } from './stats'
import { studioAbout, studioGear, studioMap, studioRooms, studioValues, studioVideo, studioVisit } from './studio'
import type { Artist, Faq, Package, SocialLink, Stat, StudioGear, StudioRoom, StudioValue, StudioVideoService } from './types'

/**
 * Contenido editable desde el panel · Contenido (`/admin/contenido`).
 * Cada sección se publica por separado; mientras una sección no tenga versión publicada,
 * la web usa estos valores iniciales (los de `src/data`). Las fotos y videos se guardan solo como ruta o URL.
 */

export type BookingService = (typeof bookingServices)[number]

export interface ContentMap {
  /** Los 5 servicios son fijos (las reservas dependen de ellos): solo se editan sus textos */
  servicios: { intro: string; items: { id: string; name: string; description: string }[] }
  paquetes: { intro: string; note: string; disclaimer: { title: string; detail: string }; items: Package[] }
  precios: { prices: Record<BookingService, number | null> }
  /** Sin la fila "Tu banda" (es fija y la agrega la página) */
  artistas: { intro: string; items: Artist[] }
  faq: { items: Faq[] }
  estudio: {
    rooms: StudioRoom[]
    about: string[]
    values: StudioValue[]
    gear: StudioGear[]
    video: StudioVideoService[]
    visit: { label: string; value: string }[]
    map: { lat: number; lng: number; zoom: number; example: boolean }
  }
  sitio: {
    slogan: string
    stats: Stat[]
    whatsapp: { display: string; number: string }
    socials: SocialLink[]
  }
}

export type ContentKey = keyof ContentMap

export const contentDefaults: ContentMap = {
  servicios: { intro: servicesIntro, items: services.map(({ id, name, description }) => ({ id, name, description })) },
  paquetes: { intro: packagesIntro, note: packagesNote, disclaimer: { ...packagesDisclaimer }, items: packages },
  precios: { prices: { ...servicePrices } },
  artistas: { intro: artistsIntro, items: artists.filter((a) => !a.cta) },
  faq: { items: faqs },
  estudio: {
    rooms: studioRooms,
    about: studioAbout,
    values: studioValues,
    gear: studioGear,
    video: studioVideo,
    visit: studioVisit,
    map: { ...studioMap },
  },
  sitio: { slogan, stats, whatsapp: { ...whatsapp }, socials },
}

/** Secciones en el orden de las pestañas, con la página donde se ve cada una */
export const contentSections: { key: ContentKey; label: string; preview: string }[] = [
  { key: 'servicios', label: 'Servicios', preview: '/servicios' },
  { key: 'paquetes', label: 'Paquetes', preview: '/servicios?vista=paquetes' },
  { key: 'precios', label: 'Precios base', preview: '/reservar' },
  { key: 'artistas', label: 'Artistas', preview: '/artistas' },
  { key: 'faq', label: 'FAQs', preview: '/faq' },
  { key: 'estudio', label: 'Estudio', preview: '/estudio' },
  { key: 'sitio', label: 'Datos del sitio', preview: '/' },
]

export const contentKeys = contentSections.map((s) => s.key)

/** id corto a partir de un nombre ("Live Session" → "live-session") para elementos nuevos */
export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'nuevo'
