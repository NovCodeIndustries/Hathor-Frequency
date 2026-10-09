import type { StudioGear, StudioRoom, StudioValue, StudioVideoService } from './types'

// TODO: fotos (src), medidas, modelos de equipo y datos de visita reales (los [..] son marcadores)

export const studioRooms: StudioRoom[] = [
  { n: '01', name: 'Sala principal', article: 'a la', size: '[m²]', description: 'Bandas completas en vivo, batería y ensambles.' },
  { n: '02', name: 'Cabina de control', article: 'a la', size: '[m²]', description: 'Grabación, mezcla y masterización.' },
  { n: '03', name: 'Cabina de voz', article: 'a la', size: '[m²]', description: 'Voces e instrumentos aislados.' },
  { n: '04', name: 'Lounge', article: 'al', size: '[m²]', description: 'Descanso y escucha entre tomas.' },
]

/** Nosotros: quiénes somos (borrador a partir del eslogan y las cifras; ajustar con la historia real) */
export const studioAbout: string[] = [
  'Hathor Frequency es un sello discográfico independiente y un estudio de producción en México. Lo hacemos músicos que llevan años del otro lado del vidrio: grabando, mezclando y filmando a bandas que están empezando.',
  'Acompañamos cada proyecto desde la primera toma hasta el lanzamiento, con sonido, video y live sessions bajo el mismo techo y la misma intención.',
]

export const studioValues: StudioValue[] = [
  { title: 'Tu sonido primero', description: 'Producimos para que suenes a ti, no a nosotros.' },
  { title: 'Todo en un solo lugar', description: 'Grabación, mezcla, master, video y live sessions con el mismo equipo.' },
  { title: 'Bandas emergentes', description: 'Trabajamos con artistas que están construyendo su camino, y lo recorremos con ellos.' },
]

export const studioGear: StudioGear[] = [
  { label: 'Micrófonos', value: '[MODELOS DE MICRÓFONOS]' },
  { label: 'Preamps y consola', value: '[MODELOS]' },
  { label: 'Monitores', value: '[MODELOS]' },
  { label: 'Backline', value: 'Batería, amplificadores de guitarra y bajo, teclados · [MODELOS]' },
  { label: 'Software', value: '[DAW Y PLUGINS]' },
  { label: 'Video', value: '[CÁMARAS E ILUMINACIÓN]' },
]

export const studioVideo: StudioVideoService[] = [
  {
    title: 'Videos musicales',
    tag: 'Videoclip',
    description: 'Videoclips con la misma intención que tu sonido: desarrollamos la idea contigo, filmamos y entregamos el video listo para publicar.',
    steps: ['Concepto', 'Preproducción', 'Rodaje', 'Edición y color', 'Entrega'],
    includes: ['Guion visual y plan de rodaje', 'Rodaje en estudio o locación [DETALLE]', 'Edición, color y entrega en formatos para redes'],
  },
  {
    title: 'Live Sessions',
    tag: 'En vivo',
    description: 'Tu show en vivo, grabado en el estudio en audio multipista y video multicámara, mezclado y editado para publicar.',
    steps: ['Ensayo', 'Montaje', 'Toma en vivo', 'Mezcla y edición', 'Entrega'],
    includes: ['Video multicámara ([N] cámaras)', 'Audio multipista, mezcla y master', 'Edición en sync lista para YouTube y redes'],
  },
]

export const studioVisit = [
  { label: 'Ubicación', value: '[ZONA / COLONIA], MX' },
  { label: 'Horario', value: '[DÍAS Y HORAS]' },
  { label: 'Llegada', value: 'Estacionamiento y carga: [DETALLE]' },
]

/**
 * Ubicación del estudio en el mapa de Visita.
 * TODO: coordenadas reales. Hoy es un punto de EJEMPLO (Plaza Río de Janeiro, Roma Norte, CDMX);
 * con `example: true` el mapa muestra la etiqueta "Ubicación de ejemplo".
 */
export const studioMap = {
  lat: 19.4194,
  lng: -99.1617,
  zoom: 16,
  example: true,
}

/** Milisegundos que dura cada espacio en el tour antes de avanzar solo */
export const studioTourInterval = 6000
