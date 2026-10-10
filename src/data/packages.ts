import type { Package } from './types'

// TODO: precios, IVA, tiempos y cantidades reales (los [..] son marcadores)

export const packagesIntro =
  'Cada paquete es un lanzamiento completo con precio cerrado. Abre la portada para ver lo que trae.'

export const packagesNote = 'Precios en MXN · [IVA INCLUIDO / MÁS IVA]'

/** Aviso sobre la vista de paquetes y en el detalle de cada uno */
export const packagesDisclaimer = {
  title: 'Precios y descripciones sujetos a cambios.',
  detail: 'Confirma el precio final y lo que incluye con tu asesor antes de reservar.',
}

export const packages: Package[] = [
  {
    n: '01',
    name: 'Demo',
    tag: 'Para empezar',
    price: '$[PRECIO]',
    short: 'Tu canción grabada y mezclada, lista para mostrarla.',
    description:
      'Pensado para bandas que quieren su primera grabación profesional. Entran a la sala, grabamos la canción en vivo o por pistas y la mezclamos con la misma atención que un sencillo.',
    includes: ['Grabación en sala de 1 canción', 'Backline y microfonía', 'Mezcla', 'Entrega en WAV y MP3'],
    delivery: '[DÍAS]',
    sessions: '[N]',
  },
  {
    n: '02',
    name: 'Sencillo',
    tag: 'Recomendado',
    price: '$[PRECIO]',
    short: 'Grabación, mezcla y master: listo para streaming.',
    description:
      'El camino completo para lanzar una canción. Grabamos, mezclamos y masterizamos para que suene igual de bien en streaming, radio o vinil.',
    includes: ['Grabación de 1 canción', 'Mezcla', 'Masterización para streaming', '[N] rondas de ajustes'],
    delivery: '[DÍAS]',
    sessions: '[N]',
  },
  {
    n: '03',
    name: 'EP',
    tag: 'Proyecto completo',
    price: '$[PRECIO]',
    short: 'Varias canciones con un mismo sonido de principio a fin.',
    description:
      'Para un lanzamiento de varias canciones que tienen que sonar como un solo proyecto. Planeamos las sesiones contigo y cuidamos la coherencia entre tracks.',
    includes: ['Grabación de hasta [N] canciones', 'Mezcla de cada track', 'Masterización del EP completo', 'Sesión de preproducción'],
    delivery: '[DÍAS]',
    sessions: '[N]',
  },
  {
    n: '04',
    name: 'Live Session',
    tag: 'Audio + video',
    price: '$[PRECIO]',
    short: 'Tu show en vivo, filmado y mezclado para publicar.',
    description:
      'Tocan en vivo en el estudio y lo capturamos en audio multipista y video multicámara. Entregamos el video editado, con mezcla y master, listo para subir.',
    includes: ['Grabación en vivo de [N] canciones', 'Video multicámara', 'Mezcla y master', 'Edición lista para publicar'],
    delivery: '[DÍAS]',
    sessions: '[N]',
  },
]
