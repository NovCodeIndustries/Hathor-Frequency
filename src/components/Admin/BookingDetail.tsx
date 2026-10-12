import { dateFromISO, formatMoney, formatStamp, type AdminBooking, type BookingStatus, type PaymentStatus } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS_SHORT } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import { STATUS_CHIP, STATUS_LABEL } from './bookingStatus'

const PAY_LABEL: Record<PaymentStatus, string> = { PENDING: 'Pago pendiente', DEPOSIT: 'Anticipo', PAID: 'Pagado' }

interface BookingDetailProps {
  booking: AdminBooking
  busy: boolean
  onStatus: (s: BookingStatus) => void
  onCharge: (mode: 'confirm' | 'edit') => void
}

/** Datos y acciones de una reserva (panel lateral en escritorio, hoja inferior en móvil) */
export function BookingDetail({ booking: b, busy, onStatus, onCharge }: BookingDetailProps) {
  const d = dateFromISO(b.date)
  return (
    <>
      <div className="hf-agenda__head">
        <span className="hf-agenda__name">{b.project}</span>
        <span className="hf-agenda__when">
          {WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} {d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)} · {formatTime(b.startTime)} · {b.service}
        </span>
      </div>
      <span className={`hf-chip hf-chip--${STATUS_CHIP[b.status]} hf-agenda__chip`}>{STATUS_LABEL[b.status]}</span>
      <dl className="hf-agenda__data">
        <dt>Representa</dt>
        <dd>
          {b.representativeName} · {b.representativeType === 'INTEGRANTE' ? 'integrante' : 'externo'}
        </dd>
        <dt>Teléfono</dt>
        <dd><a href={`tel:${b.phone.replace(/[^\d+]/g, '')}`}>{b.phone}</a></dd>
        <dt>Correo</dt>
        <dd>{b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : <span className="hf-agenda__muted">Sin correo</span>}</dd>
        <dt>Recibida</dt>
        <dd className="hf-agenda__muted">{formatStamp(b.createdAt)}</dd>
        {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
          <>
            <dt>Cobro</dt>
            <dd>
              {b.amount !== null ? formatMoney(b.amount) : 'Sin monto'} · {PAY_LABEL[b.paymentStatus]}
              {b.paymentStatus === 'DEPOSIT' && b.deposit !== null && <span className="hf-agenda__muted"> ({formatMoney(b.deposit)} recibido)</span>}
            </dd>
          </>
        )}
      </dl>
      <div className="hf-agenda__actions">
        {b.status === 'PENDING' && (
          <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={busy} onClick={() => onCharge('confirm')}>
            Confirmar sesión
          </button>
        )}
        {/* Terminada = cuenta en la cifra "Proyectos" de la web */}
        {b.status === 'CONFIRMED' && (
          <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={busy} onClick={() => onStatus('COMPLETED')}>
            Marcar como terminada
          </button>
        )}
        {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost" disabled={busy} onClick={() => onCharge('edit')}>
            Editar cobro
          </button>
        )}
        {b.status === 'COMPLETED' ? (
          <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => onStatus('CONFIRMED')}>
            Reabrir (quitar de Proyectos)
          </button>
        ) : b.status !== 'CANCELLED' ? (
          <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => onStatus('CANCELLED')}>
            Cancelar
          </button>
        ) : (
          <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => onStatus('PENDING')}>
            Reactivar
          </button>
        )}
      </div>
    </>
  )
}
