import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { adminApi, type MaintenanceState } from '../../lib/adminApi'
import { MAINTENANCE_DEFAULT_MESSAGE } from '../../lib/maintenance'
import './MaintenanceModal.css'

const pad = (n: number) => String(n).padStart(2, '0')
/** ISO → valor de <input type="datetime-local"> en hora local */
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Apagar la web completa para mantenimiento (panel · Sitio). Se aplica al instante, sin borrador:
 * quien visite la web ve la pantalla de mantenimiento y los formularios no aceptan envíos. El panel sigue igual.
 */
export function MaintenanceModal({
  state,
  onClose,
  onSaved,
  onError,
}: {
  state: MaintenanceState
  onClose: () => void
  onSaved: (s: MaintenanceState) => void
  onError: (err: unknown) => string
}) {
  const id = useId()
  const [message, setMessage] = useState(state.message ?? '')
  const [until, setUntil] = useState(toLocalInput(state.until))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const first = useRef<HTMLTextAreaElement>(null)
  useEffect(() => first.current?.focus(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (enabled: boolean) => {
    setBusy(true)
    try {
      const s = await adminApi.setMaintenance(enabled ? { enabled, message: message.trim(), until: until ? new Date(until).toISOString() : null } : { enabled })
      onSaved(s)
    } catch (err) {
      setError(onError(err))
      setBusy(false)
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save(true)
  }

  return (
    <div className="hf-asite__modal">
      <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <form className="hf-asite__confirm hf-maintm" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit}>
        <h2 id={`${id}-title`} className="hf-asite__confirm-title">
          {state.enabled ? (
            <>
              La web está <span className="hf-asite__gold">en mantenimiento</span>
            </>
          ) : (
            <>
              ¿Apagar <span className="hf-asite__gold">la web completa?</span>
            </>
          )}
        </h2>
        <p className="hf-maintm__lead">
          {state.enabled
            ? 'Puedes cambiar el mensaje o la hora de regreso, o volver a encenderla.'
            : 'Al instante, todas las páginas muestran la pantalla de mantenimiento y los formularios no aceptan envíos. El panel sigue funcionando y en Sitio y Contenido sigues viendo la web real.'}
        </p>
        <label className="hf-admin__field" htmlFor={`${id}-msg`}>
          Mensaje para los visitantes (opcional)
          <textarea
            ref={first}
            id={`${id}-msg`}
            className="hf-admin__input hf-maintm__msg"
            rows={3}
            maxLength={300}
            placeholder={MAINTENANCE_DEFAULT_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <label className="hf-admin__field" htmlFor={`${id}-until`}>
          Regreso estimado (opcional)
          <input id={`${id}-until`} className="hf-admin__input" type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
          <span className="hf-maintm__hint">Solo se muestra; la web no se enciende sola.</span>
        </label>
        {error && <p className="hf-admin__error" role="alert">{error}</p>}
        <div className="hf-asite__confirm-actions">
          {state.enabled ? (
            <>
              <button type="button" className="hf-admin__btn" disabled={busy} onClick={() => save(false)}>
                Encender la web
              </button>
              <button type="submit" className="hf-admin__btn hf-admin__btn--primary" disabled={busy}>
                Guardar cambios
              </button>
            </>
          ) : (
            <>
              <button type="button" className="hf-admin__btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="hf-admin__btn hf-admin__btn--primary" disabled={busy}>
                Apagar la web
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
