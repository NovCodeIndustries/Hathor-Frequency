import type { NavLink, SocialLink, SocialPlatform } from './types'

export const navLeft: NavLink[] = [
  { label: 'Servicios', href: '/servicios' },
  { label: 'Artistas', href: '/artistas' },
]

// /estudio aún no tiene diseño: muestra una página "Próximamente" (docs/DESIGN.md §12)
export const navRight: NavLink[] = [
  { label: 'Estudio', href: '/estudio' },
  { label: 'Contacto', href: '/contacto' },
]

// Va después del botón Reservar (desktop) y al final del menú móvil
export const navAfterCta: NavLink[] = [{ label: 'FAQs', href: '/faq' }]

export const navAll: NavLink[] = [...navLeft, ...navRight, ...navAfterCta]

export const bookingCta: NavLink = { label: 'Reservar', href: '/reservar' }

export const slogan = 'Un lugar pensado por músicos, para músicos.'

export const socials: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'Spotify', href: 'https://open.spotify.com/' },
  { label: 'YouTube', href: 'https://youtube.com/' },
]

export const socialLabels: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

// Texto provisional: reemplazar por el testimonio real (docs/DESIGN.md §12)
export const testimonial = {
  quote:
    '“Llegamos con un demo grabado en el celular y salimos con un disco que suena como siempre lo imaginamos.”',
  author: '— Sofía M., artista',
}

export const copyright = '© 2026 Hathor Frequency · MX'

export const tickerItems = ['Grabación', 'Mezcla', 'Masterización', 'Video', 'Live Sessions']
