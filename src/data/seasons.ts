/**
 * Temporadas del platillo volador (canvas https://claude.ai/artifact/G3ndhJatQyyn9ZNA7UpeBZ).
 * Cada una se activa el día 1 de su mes y se quita al terminar el mes (hora local del visitante).
 * Durante su mes, el platillo sale disfrazado en todos sus vuelos y sus 6 acciones con la página
 * reemplazan a las normales. Con `?temporada=<id>` en la URL se fuerza una (para probarla).
 */

export type SeasonId = 'anoNuevo' | 'amor' | 'nino' | 'madres' | 'independencia' | 'halloween' | 'muertos' | 'navidad'

export type GlyphName =
  | 'heart' | 'pumpkin' | 'bat' | 'flower' | 'skull' | 'snow' | 'gift' | 'star' | 'bell' | 'candle'
  | 'bread' | 'envelope' | 'balloon' | 'plane' | 'rose' | 'glass' | 'grapes' | 'wreath' | 'papel'

export interface Season {
  id: SeasonId
  name: string
  /** Mes en que está activa (0 = enero) */
  month: number
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
}

const VERDE = '#1F8A4C'
const ROJO = '#C8102E'

export const seasons: Season[] = [
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
  },
]

/** Temporada activa en la fecha dada (o la forzada con `?temporada=`), o null */
export function currentSeason(date = new Date()): Season | null {
  const forced = new URLSearchParams(window.location.search).get('temporada')
  if (forced) return seasons.find((s) => s.id === forced) ?? null
  return seasons.find((s) => s.month === date.getMonth()) ?? null
}
