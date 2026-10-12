/**
 * Horas de inicio iniciales. Se editan en el panel · Contenido · Horarios (`useContent('horarios').slots`);
 * esta lista solo vale mientras esa sección no se haya publicado. Se guardan en 24 h; se muestran con `formatTime`.
 */
export const timeSlots = ['10:00', '12:00', '15:00', '17:00', '19:00', '21:00'] as const

/** Horario seleccionado al cargar (3:00 p. m.); si ya no existe, se usa el de en medio */
export const defaultSlot = '15:00'

/** "HH:MM" en 24 h */
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

/** Máximo de horas de inicio por día (caben en la agenda del panel) */
export const maxSlots = 10

/** Ordenadas y sin repetir */
export const sortSlots = (list: readonly string[]) => [...new Set(list)].sort()

export const bookingServices = ['Grabación', 'Mezcla', 'Masterización', 'Video', 'Live Sessions'] as const

/**
 * Precio base por sesión en MXN: el panel lo propone al confirmar una reserva (se puede ajustar).
 * TODO: precios reales. `null` = sin precio base todavía; el monto se captura a mano.
 */
export const servicePrices: Record<(typeof bookingServices)[number], number | null> = {
  Grabación: null,
  Mezcla: null,
  Masterización: null,
  Video: null,
  'Live Sessions': null,
}

/** Representante: botones y textos de ayuda según el tipo */
export const representativeTypes = [
  {
    value: 'integrante',
    label: 'Integrante de la banda',
    placeholder: 'Nombre completo del integrante',
    help: 'La persona de la banda a la que contactaremos.',
  },
  {
    value: 'externo',
    label: 'Externo',
    placeholder: 'Nombre completo (mánager, productor…)',
    help: 'Alguien fuera de la banda que coordina la sesión: mánager, productor o similar.',
  },
] as const

/**
 * Easter egg de Reservar: el extraterrestre rockero (G2 · Contorno dorado).
 * Sale cada `intervalSeconds` mientras la página de Reservar está abierta y visible:
 * la primera vez a los N segundos de entrar y después N segundos tras terminar la escena anterior.
 * Con `?alien=1` en la URL la primera sale al cargar (para probarlo).
 */
export const rockAlienSchedule = {
  intervalSeconds: 15,
}
