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

// TODO: número real. `number` en formato internacional solo con dígitos (52 + 10 dígitos) para el link de wa.me;
// mientras esté vacío, se muestra el número sin link.
export const whatsapp = {
  display: '[NÚMERO DE WHATSAPP]',
  number: '',
}

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

/**
 * Platillo volador que explora todo el sitio: en cada vista hace una de sus acciones
 * (U2 escucha, U3 zigzag, U4 scratch, U5 se lleva una letra, U6 onda en el cielo), en orden al azar,
 * con una espera al azar entre `minSeconds` y `maxSeconds` desde que termina la anterior,
 * solo con la pestaña visible. Con `?ovni=1` en la URL la primera sale al cargar (para probarlo).
 */
export const ufoSchedule = {
  minSeconds: 30,
  maxSeconds: 60,
}
