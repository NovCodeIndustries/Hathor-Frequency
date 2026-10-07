import type { Service } from './types'

export const servicesIntro =
  'Sube el fader de lo que necesitas: cada servicio funciona solo, pero suena mejor cuando pasan por la misma consola.'

export const services: Service[] = [
  {
    ch: '01',
    name: 'Grabación',
    description: 'Sala, microfonía y backline listos; en vivo o por pistas.',
    level: 80,
    knobs: [[8, 8], [26, 9]],
  },
  {
    ch: '02',
    name: 'Mezcla',
    description: 'Balance, espacio y carácter sin perder la energía de la toma.',
    level: 55,
    knobs: [[17, 4], [7, 12]],
  },
  {
    ch: '03',
    name: 'Masterización',
    description: 'Consistencia y pegada para streaming, radio y vinil.',
    level: 87,
    knobs: [[27, 12], [11, 5]],
  },
  {
    ch: '04',
    name: 'Video',
    description: 'Videoclips con la misma intención que tu sonido.',
    level: 39,
    knobs: [[6, 17], [23, 5]],
  },
  {
    ch: '05',
    name: 'Live Sessions',
    description: 'Tu show en vivo, audio y video, listo para publicar.',
    level: 69,
    knobs: [[28, 20], [9, 7]],
  },
]
