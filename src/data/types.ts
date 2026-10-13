export type Point = readonly [number, number]

export interface Service {
  /** Id fijo para el panel · Sitio (módulo `servicios.<id>`) */
  id: string
  ch: string
  name: string
  description: string
  /** Nivel inicial del fader, 0–100 (el usuario lo puede mover) */
  level: number
  /** Extremo (x2, y2) de la línea de cada perilla, viewBox 34 */
  knobs: readonly [Point, Point]
}

export type ArtistPattern = 'circles' | 'diagonals' | 'triangles' | 'waves' | 'bars' | 'grid' | 'add'

export interface Artist {
  code: string
  side: 'A' | 'B'
  name: string
  genre: string
  pattern: ArtistPattern
  href: string
  /** Fila de llamada a la acción ("Tu banda") */
  cta?: boolean
  /** Panel de detalle (no aplica a la fila CTA) */
  bio?: string
  quote?: string
  socials?: ArtistSocial[]
  videos?: MediaItem[]
  photos?: MediaItem[]
}

export type SocialPlatform = 'instagram' | 'spotify' | 'youtube' | 'tiktok'

export interface ArtistSocial {
  platform: SocialPlatform
  href: string
}

export interface MediaItem {
  title: string
  /** Duración (video) o crédito (foto) */
  detail: string
  /** Foto: URL de la imagen */
  src?: string
  /** Video: URL de embed (p. ej. https://www.youtube-nocookie.com/embed/<id>) */
  embed?: string
}

export interface Stat {
  /** Lo que se muestra si `source` es manual (o mientras carga la cifra de la base) */
  value: string
  label: string
  /** De dónde sale: escrita a mano, o contada en la base (proyectos terminados / artistas publicados) */
  source?: 'manual' | 'proyectos' | 'artistas'
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
  /** Id fijo para el panel · Sitio (módulo `paquetes.<id>`) */
  id: string
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

export interface Faq {
  /** Id fijo para el panel · Sitio (módulo `faq.<id>`) */
  id: string
  /** Grupo en la lista (las preguntas de un mismo grupo van juntas) */
  category: string
  q: string
  a: string
}

export interface StudioRoom {
  n: string
  name: string
  /** "a la" / "al", para el titular "Entra a la Sala principal." */
  article: 'a la' | 'al'
  size: string
  description: string
  /** Foto del espacio; sin ella se muestra un marcador */
  src?: string
}

export interface StudioGear {
  label: string
  value: string
  src?: string
}

export interface StudioValue {
  title: string
  description: string
}

export interface StudioVideoService {
  title: string
  /** Etiqueta corta ("Videoclip", "En vivo") */
  tag: string
  description: string
  steps: string[]
  includes: string[]
  /** Video de muestra: URL de embed (p. ej. https://www.youtube-nocookie.com/embed/<id>) */
  embed?: string
}

/** Opinión publicada en el sitio (ya revisada; sin permiso de nombre llega como "Anónimo") */
export interface Review {
  /** Id en la tabla `reviews` */
  id?: string
  name: string
  /** Banda o proyecto (opcional) */
  project?: string
  /** Servicio sobre el que opina (`contactTopics`) */
  service: string
  /** 1 a 5 estrellas */
  rating: number
  text: string
}

/** Estado de un plugin en la web: el LED del pedal se enciende solo si está disponible */
export type PluginStatus = 'available' | 'beta' | 'soon'
export type PluginFormat = 'VST3' | 'AU' | 'AAX' | 'CLAP'
export type PluginSystem = 'macOS' | 'Windows' | 'Linux'

/** Plugin de audio desarrollado por el estudio (`/plugins`, panel · Plugins) */
export interface Plugin {
  /** Id fijo: módulo `plugins.<id>` del panel · Sitio y llave de sus versiones y descargas */
  id: string
  name: string
  /** Tipo ("Dinámica", "EQ"…): agrupa los filtros de la página */
  category: string
  status: PluginStatus
  /** Una línea para el pedal / la unidad del rack */
  short: string
  /** Descripción completa (panel de detalle) */
  description: string
  formats: PluginFormat[]
  systems: PluginSystem[]
  free: boolean
  /** Precio en MXN ya formateado ("$1,200"); se ignora si es gratis */
  price: string
  /** Tienda, beta o descarga externa (https); vacío = se descarga la versión actual del estudio */
  link: string
  /** Nombres de las perillas que se dibujan (2 a 4) */
  controls: string[]
  /** Captura de la interfaz (ruta /media/… o URL) */
  image?: string
  /** Demo "Antes y después": la misma toma sin y con el plugin (audio) */
  demoBefore?: string
  demoAfter?: string
}

/** Versión actual de cada plugin (`GET /api/plugins/releases`) */
export interface PluginReleaseInfo {
  version: string
  mac: boolean
  win: boolean
}
