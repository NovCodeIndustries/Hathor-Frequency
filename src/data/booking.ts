export const timeSlots = ['10:00', '12:00', '15:00', '17:00', '19:00', '21:00'] as const

/** Índice del horario seleccionado al cargar (15:00) */
export const defaultSlotIndex = 2

export const bookingServices = ['Grabación', 'Mezcla', 'Masterización', 'Video', 'Live Sessions'] as const

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
