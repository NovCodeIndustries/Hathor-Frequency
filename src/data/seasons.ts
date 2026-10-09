/**
 * Temporadas del sitio (canvas del platillo https://claude.ai/artifact/G3ndhJatQyyn9ZNA7UpeBZ y
 * de las páginas https://claude.ai/artifact/YL2L4g49hnmmboNEfLuRR4).
 * - Las de mes se activan el día 1 y se quitan al terminar el mes (hora local del visitante).
 * - Los cumpleaños (`date`) solo duran ese día y, ese día, tienen prioridad sobre la del mes.
 * Durante una temporada el platillo sale disfrazado y sus 6 acciones reemplazan a las normales, y las
 * páginas llevan su capa fija (`page`). Con `?temporada=<id>` en la URL se fuerza una (para probarla).
 */

export type SeasonId =
  | 'anoNuevo' | 'amor' | 'nino' | 'madres' | 'independencia' | 'halloween' | 'muertos' | 'navidad'
  | 'cumpleMarzo' | 'cumpleAbril'

export type GlyphName =
  | 'heart' | 'pumpkin' | 'bat' | 'flower' | 'skull' | 'snow' | 'gift' | 'star' | 'bell' | 'candle'
  | 'bread' | 'envelope' | 'balloon' | 'plane' | 'rose' | 'glass' | 'grapes' | 'wreath' | 'papel' | 'cake' | 'flag'

/** Capa fija de la temporada en las páginas, todo el tiempo que esté activa */
export interface SeasonPage {
  /** Adorno bajo el menú */
  garland: { kind: 'papel' | 'lights' | 'confetti' | 'glyphs'; glyph?: GlyphName; colors: string[] }
  /** Detalle junto al logo del menú */
  logo: GlyphName
  /** Separador del ticker en lugar de ◆ */
  sep: string
  /** Palabra que se suma al ticker */
  ticker: string
  /** Mensaje del footer */
  footer: string
  /** Home: glifo sobre la etiqueta del vinilo, partículas y cierre del titular */
  label: GlyphName
  particle: GlyphName
  heroClose: string
  /** Servicios: color de cada cap */
  caps: string[]
  /** Contacto: texto de ejemplo del campo de correo */
  placeholder: string
  /** Estudio: eyebrow del tour */
  eyebrow: string
}

export interface Season {
  id: SeasonId
  name: string
  /** Mes en que está activa (0 = enero) */
  month: number
  /** Solo para cumpleaños: el día exacto en que está activa */
  date?: { month: number; day: number }
  /** Color de acento (etiquetas, textos) */
  acc: string
  /** Color del rayo */
  beam: string
  /** Luces del borde del platillo */
  light: string
  /** Cara del alien en la cabina */
  face?: 'calavera'
  /** Home: algo sobre la etiqueta del vinilo, fuegos artificiales sobre el título o un camino de pétalos */
  home:
    | { kind: 'label'; glyph: GlyphName; particles: GlyphName; motion: 'rise' | 'fall' | 'pop'; colors?: string[] }
    | { kind: 'fireworks'; colors: string[]; message: string; confetti?: boolean }
    | { kind: 'trail'; glyph: GlyphName }
  /** Servicios: color de cada cap (null = sin cambio), movimiento y adorno sobre cada canal */
  faders: { colors: (string | null)[]; motion?: 'drop' | 'wave' | 'countdown'; deco?: GlyphName; lights?: boolean }
  /** Artistas: deja algo en un track (o lo vuelve fantasma) */
  track: { target: number; glyphs?: GlyphName[]; note?: string; ghost?: string }
  /** Reservar: día del mes con su sello y etiqueta (solo visual) */
  day: { day: number; glyph: GlyphName; tip: string }
  /** Contacto: correo que escribe y borra */
  email: string
  /** Ticker: palabra que pone en lugar de otra; `bats` suelta murciélagos */
  ticker: { word?: string; color: string; bats?: boolean }
  page: SeasonPage
}

const VERDE = '#1F8A4C'
const ROJO = '#C8102E'

// TODO: nombres de quienes cumplen (marcadores [..]); cada cumpleaños puede tener su propio nombre
const BIRTHDAY_NAME = '[NOMBRE]'
const PARTY = ['#F2C94C', '#E8577D', '#3FA9F5', '#7bb342', '#F2C94C']

export const seasons: Season[] = [
  {
    id: 'cumpleMarzo',
    name: 'Cumpleaños · 3 de marzo',
    month: 2,
    date: { month: 2, day: 3 },
    acc: '#F2C94C',
    beam: 'rgba(232,87,125,0.4)',
    light: '#E8577D',
    home: { kind: 'fireworks', colors: ['#F2C94C', '#E8577D', '#3FA9F5'], message: '¡Feliz cumpleaños, ' + BIRTHDAY_NAME + '!', confetti: true },
    faders: { colors: PARTY, motion: 'countdown' },
    track: { target: 0, glyphs: ['gift', 'cake'], note: 'Para ' + BIRTHDAY_NAME + ' ♥' },
    day: { day: 3, glyph: 'cake', tip: 'Cumpleaños de ' + BIRTHDAY_NAME },
    email: 'pastel@andromeda.fm',
    ticker: { word: '¡Feliz cumple!', color: '#E8577D' },
    page: {
      garland: { kind: 'confetti', colors: PARTY },
      logo: 'cake', sep: '★', ticker: '¡Feliz cumpleaños, ' + BIRTHDAY_NAME + '!', footer: 'Hoy cumple ' + BIRTHDAY_NAME + ' ♥',
      label: 'cake', particle: 'balloon', heroClose: 'está de fiesta.',
      caps: PARTY,
      placeholder: 'Tu correo · y tu felicitación', eyebrow: 'Estudio · Hoy hay pastel',
    },
  },
  {
    id: 'cumpleAbril',
    name: 'Cumpleaños · 16 de abril',
    month: 3,
    date: { month: 3, day: 16 },
    acc: '#F2C94C',
    beam: 'rgba(232,87,125,0.4)',
    light: '#E8577D',
    home: { kind: 'fireworks', colors: ['#F2C94C', '#E8577D', '#3FA9F5'], message: '¡Feliz cumpleaños, ' + BIRTHDAY_NAME + '!', confetti: true },
    faders: { colors: PARTY, motion: 'countdown' },
    track: { target: 0, glyphs: ['gift', 'cake'], note: 'Para ' + BIRTHDAY_NAME + ' ♥' },
    day: { day: 16, glyph: 'cake', tip: 'Cumpleaños de ' + BIRTHDAY_NAME },
    email: 'pastel@andromeda.fm',
    ticker: { word: '¡Feliz cumple!', color: '#E8577D' },
    page: {
      garland: { kind: 'confetti', colors: PARTY },
      logo: 'cake', sep: '★', ticker: '¡Feliz cumpleaños, ' + BIRTHDAY_NAME + '!', footer: 'Hoy cumple ' + BIRTHDAY_NAME + ' ♥',
      label: 'cake', particle: 'balloon', heroClose: 'está de fiesta.',
      caps: PARTY,
      placeholder: 'Tu correo · y tu felicitación', eyebrow: 'Estudio · Hoy hay pastel',
    },
  },

  {
    id: 'anoNuevo',
    name: 'Año Nuevo',
    month: 0,
    acc: '#F2C94C',
    beam: 'rgba(242,201,76,0.45)',
    light: '#C9CED6',
    home: { kind: 'fireworks', colors: ['#F2C94C', '#C9CED6', '#fff3c4'], message: '¡Feliz Año Nuevo!', confetti: true },
    faders: { colors: ['#F2C94C', '#F2C94C', '#F2C94C', '#F2C94C', '#F2C94C'], motion: 'countdown' },
    track: { target: 0, glyphs: ['grapes', 'grapes', 'grapes'], note: '12 uvas, 12 canciones' },
    day: { day: 1, glyph: 'glass', tip: 'Primera sesión del año' },
    email: 'deseos@andromeda.fm',
    ticker: { word: 'Feliz Año Nuevo', color: '#F2C94C' },
    page: {
      garland: { kind: 'confetti', colors: ['#F2C94C', '#C9CED6', '#fff3c4'] },
      logo: 'star', sep: '★', ticker: 'Feliz Año Nuevo', footer: '¡Feliz Año Nuevo desde la cabina!',
      label: 'glass', particle: 'star', heroClose: 'empieza aquí.',
      caps: ['#F2C94C', '#C9CED6', '#F2C94C', '#C9CED6', '#F2C94C'],
      placeholder: 'Tu correo · y tu propósito musical', eyebrow: 'Estudio · Abrimos el año',
    },
  },
  {
    id: 'amor',
    name: 'Amor y amistad',
    month: 1,
    acc: '#E8577D',
    beam: 'rgba(232,87,125,0.45)',
    light: '#E8577D',
    home: { kind: 'label', glyph: 'heart', particles: 'heart', motion: 'rise' },
    faders: { colors: ['#E8577D', '#E8577D', '#E8577D', '#E8577D', '#E8577D'], deco: 'heart' },
    track: { target: 2, glyphs: ['envelope'], note: 'Para Luna K. ♥' },
    day: { day: 14, glyph: 'heart', tip: 'Sesión para dos' },
    email: 'cupido@andromeda.fm',
    ticker: { word: 'Mezcla ♥', color: '#E8577D' },
    page: {
      garland: { kind: 'glyphs', glyph: 'heart', colors: ['#E8577D'] },
      logo: 'heart', sep: '♥', ticker: 'Amor y amistad', footer: 'Hecho con ♥ en MX',
      label: 'heart', particle: 'heart', heroClose: 'se canta a dúo.',
      caps: ['#E8577D', '#E8577D', '#E8577D', '#E8577D', '#E8577D'],
      placeholder: 'Tu correo · y el de tu dueto', eyebrow: 'Estudio · Mes del amor',
    },
  },
  {
    id: 'nino',
    name: 'Día del Niño',
    month: 3,
    acc: '#3FA9F5',
    beam: 'rgba(63,169,245,0.45)',
    light: '#3FA9F5',
    home: { kind: 'label', glyph: 'balloon', particles: 'balloon', motion: 'rise', colors: ['#3FA9F5', '#FF6B5A', '#F2C94C', '#7bb342'] },
    faders: { colors: ['#FF6B5A', '#F2C94C', '#3FA9F5', '#7bb342', '#FF6B5A'], motion: 'wave' },
    track: { target: 1, glyphs: ['plane'], note: '“¡Otra vez!”' },
    day: { day: 30, glyph: 'balloon', tip: 'Día del Niño' },
    email: 'recreo@andromeda.fm',
    ticker: { word: '¡A jugar!', color: '#FF6B5A' },
    page: {
      garland: { kind: 'glyphs', glyph: 'balloon', colors: ['#3FA9F5', '#FF6B5A', '#F2C94C', '#7bb342'] },
      logo: 'balloon', sep: '●', ticker: '¡A jugar!', footer: 'Para el niño que tocaba en la cocina',
      label: 'balloon', particle: 'balloon', heroClose: 'también se juega.',
      caps: ['#FF6B5A', '#F2C94C', '#3FA9F5', '#7bb342', '#FF6B5A'],
      placeholder: 'Tu correo · ¿qué querías tocar de niño?', eyebrow: 'Estudio · Mes del niño',
    },
  },
  {
    id: 'madres',
    name: 'Día de las Madres',
    month: 4,
    acc: '#F4A6C0',
    beam: 'rgba(244,166,192,0.45)',
    light: '#F4A6C0',
    home: { kind: 'label', glyph: 'rose', particles: 'rose', motion: 'pop' },
    faders: { colors: ['#F4A6C0', '#F4A6C0', '#F4A6C0', '#F4A6C0', '#F4A6C0'], deco: 'rose' },
    track: { target: 0, glyphs: ['rose', 'rose', 'rose'], note: 'Para todas las mamás que nos llevaron al primer ensayo' },
    day: { day: 10, glyph: 'rose', tip: 'Serenata para mamá' },
    email: 'serenata@andromeda.fm',
    ticker: { word: 'Para mamá ♥', color: '#F4A6C0' },
    page: {
      garland: { kind: 'glyphs', glyph: 'rose', colors: ['#F4A6C0', '#E8577D'] },
      logo: 'rose', sep: '✿', ticker: 'Para mamá', footer: 'Para mamá, con música',
      label: 'rose', particle: 'rose', heroClose: 'suena a mamá.',
      caps: ['#F4A6C0', '#F4A6C0', '#F4A6C0', '#F4A6C0', '#F4A6C0'],
      placeholder: 'Tu correo · y la canción favorita de tu mamá', eyebrow: 'Estudio · Mes de mamá',
    },
  },
  {
    id: 'independencia',
    name: 'Fiestas patrias',
    month: 8,
    acc: VERDE,
    beam: 'rgba(31,138,76,0.45)',
    light: '#F2C94C',
    home: { kind: 'fireworks', colors: [VERDE, '#f4f4f4', ROJO], message: '¡Viva México!' },
    faders: { colors: [VERDE, '#f4f4f4', ROJO, null, null] },
    track: { target: 0, glyphs: ['papel'] },
    day: { day: 15, glyph: 'bell', tip: 'Noche del Grito' },
    email: 'viva@mexico.fm',
    ticker: { word: '¡Viva México!', color: ROJO },
    page: {
      garland: { kind: 'papel', colors: [VERDE, '#f4f4f4', ROJO] },
      logo: 'bell', sep: '★', ticker: '¡Viva México!', footer: 'Hecho en México',
      label: 'flag', particle: 'star', heroClose: 'suena a México.',
      caps: [VERDE, '#f4f4f4', ROJO, '#F2C94C', '#F2C94C'],
      placeholder: 'Tu correo · ¡que viva la música!', eyebrow: 'Estudio · Mes patrio',
    },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    month: 9,
    acc: '#F28C28',
    beam: 'rgba(123,63,160,0.5)',
    light: '#F28C28',
    home: { kind: 'label', glyph: 'pumpkin', particles: 'bat', motion: 'rise' },
    faders: { colors: ['#7B3FA0', '#7B3FA0', '#7B3FA0', '#7B3FA0', '#7B3FA0'], motion: 'drop' },
    track: { target: 1, ghost: '¡Bu!' },
    day: { day: 31, glyph: 'pumpkin', tip: 'Sesión de terror' },
    email: 'bu@ultratumba.fm',
    ticker: { color: '#F28C28', bats: true },
    page: {
      garland: { kind: 'glyphs', glyph: 'bat', colors: ['#7B3FA0'] },
      logo: 'pumpkin', sep: '✦', ticker: 'Halloween', footer: 'Aquí grabamos hasta los gritos',
      label: 'pumpkin', particle: 'bat', heroClose: 'da miedo.',
      caps: ['#7B3FA0', '#F28C28', '#7B3FA0', '#F28C28', '#7B3FA0'],
      placeholder: 'Tu correo… si te atreves', eyebrow: 'Estudio · Sala embrujada',
    },
  },
  {
    id: 'muertos',
    name: 'Día de Muertos',
    month: 10,
    acc: '#F7A21B',
    beam: 'rgba(247,162,27,0.45)',
    light: '#F7A21B',
    face: 'calavera',
    home: { kind: 'trail', glyph: 'flower' },
    faders: { colors: [null, null, null, null, null], deco: 'candle' },
    track: { target: 0, glyphs: ['bread', 'candle'], note: 'Para los que pusieron la música antes' },
    day: { day: 2, glyph: 'skull', tip: 'Día de Muertos' },
    email: 'catrina@mictlan.fm',
    ticker: { word: 'Calaverita', color: '#E4007C' },
    page: {
      garland: { kind: 'papel', colors: ['#6B2D8C', '#E4007C', '#F7A21B'] },
      logo: 'flower', sep: '✿', ticker: 'Ofrenda musical', footer: 'Para los que pusieron la música antes',
      label: 'skull', particle: 'flower', heroClose: 'no se olvida.',
      caps: ['#F7A21B', '#6B2D8C', '#E4007C', '#6B2D8C', '#F7A21B'],
      placeholder: 'Tu correo · y a quién le cantas', eyebrow: 'Estudio · Ofrenda en la sala',
    },
  },
  {
    id: 'navidad',
    name: 'Navidad',
    month: 11,
    acc: ROJO,
    beam: 'rgba(255,255,255,0.35)',
    light: ROJO,
    home: { kind: 'label', glyph: 'wreath', particles: 'snow', motion: 'fall' },
    faders: { colors: [ROJO, '#1F7A3A', ROJO, '#1F7A3A', ROJO], lights: true },
    track: { target: 1, glyphs: ['gift'], note: 'Regalo para RALO' },
    day: { day: 24, glyph: 'star', tip: 'Sesión navideña' },
    email: 'santa@polonorte.fm',
    ticker: { word: 'Feliz Navidad', color: '#1F7A3A' },
    page: {
      garland: { kind: 'lights', colors: [ROJO, '#1F7A3A', '#F2C94C'] },
      logo: 'star', sep: '❄', ticker: 'Feliz Navidad', footer: 'Felices fiestas desde Hathor',
      label: 'wreath', particle: 'snow', heroClose: 'huele a ponche.',
      caps: [ROJO, '#1F7A3A', ROJO, '#1F7A3A', ROJO],
      placeholder: 'Tu correo · y tu villancico favorito', eyebrow: 'Estudio · Edición navideña',
    },
  },
]

/** Temporada activa en la fecha dada (o la forzada con `?temporada=`), o null. Un cumpleaños gana ese día */
export function currentSeason(date = new Date()): Season | null {
  const forced = new URLSearchParams(window.location.search).get('temporada')
  if (forced) return seasons.find((s) => s.id === forced) ?? null
  const birthday = seasons.find((s) => s.date && s.date.month === date.getMonth() && s.date.day === date.getDate())
  return birthday ?? seasons.find((s) => !s.date && s.month === date.getMonth()) ?? null
}
