import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { servicePrices } from '../../data/booking'
import { packages } from '../../data/packages'
import { adminApi, dateFromISO, formatMoney, type AdminBooking, type PaymentStatus } from '../../lib/adminApi'
import { MONTHS, WEEKDAYS_SHORT } from '../../lib/calendar'
import { formatTime } from '../../lib/time'
import './ChargeModal.css'

/** Lo mínimo de una reserva que necesita la ventana (sirve desde la agenda y desde el dashboard) */
export interface ChargeTarget {
  id: string
  date: string
  startTime: string
  service: string
  project: string
  amount?: number | null
  paymentStatus?: PaymentStatus
  deposit?: number | null
}

interface ChargeModalProps {
  booking: ChargeTarget
  /** confirm: confirma la reserva y guarda el cobro · edit: solo el cobro de una ya confirmada */
  mode: 'confirm' | 'edit'
  onClose: () => void
  onSaved: (b: AdminBooking) => void
  onError: (err: unknown) => string
}

const PAY: { value: PaymentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'DEPOSIT', label: 'Anticipo' },
  { value: 'PAID', label: 'Pagado' },
]

/** "2,400" → 2400; vacío o inválido → null */
const parseMoney = (s: string) => {
  const n = Number(s.replace(/[$,\s]/g, ''))
  return s.trim() && Number.isFinite(n) && n >= 0 ? n : null
}
const inputMoney = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('en-US', { maximumFractionDigits: 2 }))

/** Precio de un paquete si ya es un número ("$4,500" → 4500); los marcadores "$[PRECIO]" no cuentan */
const packagePrice = (price: string) => {
  const n = Number(price.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Ventana de cobro (diseño M2, canvas https://claude.ai/artifact/7wwLUsR6SBNYJoY88dma8W):
 * monto con atajos (precio base, −10%, paquetes), estado de pago y anticipo.
 */
export function ChargeModal({ booking, mode, onClose, onSaved, onError }: ChargeModalProps) {
  const id = useId()
  const amountRef = useRef<HTMLInputElement>(null)
  const base = servicePrices[booking.service as keyof typeof servicePrices] ?? null
  const [amount, setAmount] = useState(() => inputMoney(booking.amount ?? base))
  const [pay, setPay] = useState<PaymentStatus>(booking.paymentStatus ?? 'PENDING')
  const [deposit, setDeposit] = useState(() => inputMoney(booking.deposit))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    amountRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  const value = parseMoney(amount)
  const chips = [
    ...(base ? [{ label: `Precio base · ${formatMoney(base)}`, v: base }] : []),
    ...(base ? [{ label: `−10% · ${formatMoney(Math.round(base * 0.9))}`, v: Math.round(base * 0.9) }] : []),
    ...packages.flatMap((p) => {
      const v = packagePrice(p.price)
      return v ? [{ label: `Paquete ${p.name} · ${formatMoney(v)}`, v }] : []
    }),
  ]

  const d = dateFromISO(booking.date)
  const when = `${WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} · ${formatTime(booking.startTime)}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const dep = pay === 'DEPOSIT' ? parseMoney(deposit) : null
    if (amount.trim() && value === null) return setError('Escribe el monto en números.')
    if (pay === 'DEPOSIT' && dep === null) return setError('Escribe el anticipo recibido.')
    if (dep !== null && value !== null && dep > value) return setError('El anticipo no puede ser mayor que el monto.')
    setSaving(true)
    setError('')
    try {
      const saved = await adminApi.updateBooking(booking.id, {
        ...(mode === 'confirm' ? { status: 'CONFIRMED' as const } : {}),
        amount: value,
        paymentStatus: pay,
        deposit: dep,
      })
      onSaved(saved)
    } catch (err) {
      setError(onError(err))
      setSaving(false)
    }
  }

  const cta = mode === 'confirm' ? 'Confirmar' : 'Guardar'

  return createPortal(
    <div className="hf-charge">
      <button type="button" className="hf-charge__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <form className="hf-charge__card" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit}>
        <div className="hf-charge__head">
          <div>
            <h2 id={`${id}-title`} className="hf-charge__title">
              {mode === 'confirm' ? 'Confirmar' : 'Cobro de la'} <span>sesión</span>
            </h2>
            <p className="hf-charge__sub">
              {booking.project} · {when} · {booking.service}
            </p>
          </div>
          <button type="button" className="hf-charge__close" aria-label="Cerrar" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>

        <label className="hf-admin__field" htmlFor={`${id}-amount`}>
          Monto · MXN
          <span className="hf-charge__money">
            <span aria-hidden="true">$</span>
            <input
              ref={amountRef}
              id={`${id}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={base ? undefined : 'Sin precio base'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </span>
        </label>
        {chips.length > 0 ? (
          <div className="hf-charge__chips" role="group" aria-label="Atajos de monto">
            {chips.map((c) => (
              <button key={c.label} type="button" className="hf-charge__chip" onClick={() => setAmount(inputMoney(c.v))}>
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="hf-charge__hint">Sin precio base para {booking.service}: escribe el monto acordado.</p>
        )}

        <fieldset className="hf-charge__pay">
          <legend>Pago</legend>
          <div className="hf-charge__pay-grid">
            {PAY.map((p) => (
              <button key={p.value} type="button" className="hf-admin__filter" aria-pressed={pay === p.value} onClick={() => setPay(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {pay === 'DEPOSIT' && (
          <label className="hf-admin__field" htmlFor={`${id}-deposit`}>
            Anticipo recibido
            <span className="hf-charge__money hf-charge__money--sm">
              <span aria-hidden="true">$</span>
              <input id={`${id}-deposit`} type="text" inputMode="decimal" autoComplete="off" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </span>
          </label>
        )}

        <p className="hf-admin__error" role="status">{error}</p>

        <div className="hf-charge__actions">
          <button type="button" className="hf-admin__btn" onClick={onClose}>Volver</button>
          <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-charge__submit" disabled={saving}>
            {saving ? 'Guardando…' : value !== null ? `${cta} · ${formatMoney(value)}` : `${cta} sin monto`}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
