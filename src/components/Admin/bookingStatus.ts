import type { BookingStatus } from '../../lib/adminApi'

export const STATUS_LABEL: Record<BookingStatus, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Terminada' }
export const STATUS_CHIP: Record<BookingStatus, string> = { PENDING: 'pending', CONFIRMED: 'done', CANCELLED: 'off', COMPLETED: 'finished' }
