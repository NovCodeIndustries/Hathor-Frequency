export const timeSlots = ['10:00', '12:00', '15:00', '17:00', '19:00', '21:00'] as const

/** Índice del horario seleccionado al cargar (15:00) */
export const defaultSlotIndex = 2

export const bookingServices = ['Grabación', 'Mezcla', 'Masterización', 'Video', 'Live Sessions'] as const

// TODO: reemplazar [TIEMPO DE RESPUESTA] por el tiempo real (pendiente en docs/DESIGN.md §12)
export const responseNote =
  'Te confirmamos disponibilidad por correo en menos de [TIEMPO DE RESPUESTA].'
