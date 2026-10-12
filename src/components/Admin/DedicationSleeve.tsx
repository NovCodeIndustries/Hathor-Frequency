import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminApi, type BirthdayPerson } from '../../lib/adminApi'
import './Dedications.css'

/**
 * D2 · Firma la funda: el equipo escribe su dedicatoria a quien cumple hoy. En la funda solo se ven las firmas;
 * el texto lo lee quien cumple, una a una. Se puede cambiar durante el día.
 */
export function DedicationSleeve({
  person,
  me,
  onClose,
  onSaved,
  onError,
}: {
  person: BirthdayPerson
  /** Cómo firmo ("Xavier R.") */
  me: string
  onClose: () => void
  onSaved: () => void
  onError: (err: unknown) => string
}) {
  const id = useId()
  const [text, setText] = useState(person.mine?.text ?? '')
  const [anonymous, setAnonymous] = useState(person.mine?.anonymous ?? false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const done = useRef<HTMLButtonElement>(null)

  useEffect(() => (sent ? done.current : area.current)?.focus(), [sent])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const editing = !!person.mine
  const mySign = anonymous ? 'Anónimo' : me
  // Mi firma en la funda: la de antes se reemplaza por la nueva
  const prevIndex = person.mine ? person.signers.indexOf(person.mine.anonymous ? 'Anónimo' : me) : -1
  const others = person.signers.filter((_, i) => i !== prevIndex)
  const signers = sent || text.trim() ? [...others, mySign] : others

  const save = async () => {
    setBusy(true)
    try {
      await adminApi.signDedication(person.id, text.trim(), anonymous)
      setError('')
      setSent(true)
      onSaved()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="hf-dsleeve">
      <button type="button" className="hf-dsleeve__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
      <div className="hf-dsleeve__box" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        {/* La funda del disco */}
        <div className="hf-dsleeve__art">
          <div className={`hf-dsleeve__vinyl ${sent ? 'is-in' : 'is-out'}`} aria-hidden="true">
            <svg className="hf-dsleeve__spin" viewBox="0 0 380 380">
              <circle cx="190" cy="190" r="186" fill="#070707" stroke="#B8860B" strokeWidth="2" />
              <circle cx="190" cy="190" r="150" fill="none" stroke="#F2C94C" strokeOpacity=".15" />
              <circle cx="190" cy="190" r="120" fill="none" stroke="#F2C94C" strokeOpacity=".2" />
              <circle cx="190" cy="190" r="64" fill="#E8577D" />
              <circle cx="190" cy="190" r="5" fill="#000" />
            </svg>
          </div>
          <div className="hf-dsleeve__cover">
            <span className="hf-dsleeve__label">Hathor Frequency · Edición cumpleaños</span>
            <div>
              <p className="hf-dsleeve__for">Para</p>
              <p className="hf-dsleeve__for hf-dsleeve__for--name">{person.name}</p>
            </div>
            <div className="hf-dsleeve__signs" aria-label="Quién ya firmó">
              {signers.map((s, i) => (
                <span key={`${s}-${i}`} style={{ transform: `rotate(${(i % 3) * 3 - 4}deg)` }}>{s}</span>
              ))}
            </div>
          </div>
          <p className="hf-dsleeve__count">
            {signers.length ? `Ya firmaron ${signers.length} del equipo` : 'Sé la primera firma'}
          </p>
        </div>

        {/* Escribir */}
        <div className="hf-dsleeve__form">
          {sent ? (
            <>
              <span className="hf-dsleeve__kick">Listo</span>
              <h2 id={`${id}-title`} className="hf-dsleeve__title">Tu firma quedó en la funda.</h2>
              <p className="hf-dsleeve__text">El disco ya está guardado para {person.firstName}. Lo abrirá al entrar al panel; puedes cambiar tu dedicatoria durante el día.</p>
              <button ref={done} type="button" className="hf-dsleeve__btn hf-dsleeve__end" onClick={onClose}>Ir al panel</button>
            </>
          ) : (
            <>
              <span className="hf-dsleeve__kick">Hoy cumple años {person.name}</span>
              <h2 id={`${id}-title`} className="hf-dsleeve__title">{editing ? 'Cambia tu dedicatoria' : 'Firma su funda'}</h2>
              <p className="hf-dsleeve__text">Todo el equipo firma el mismo disco. En la funda solo se ven las firmas; lo que escribas lo lee {person.firstName}, una dedicatoria a la vez.</p>
              <label className="hf-admin__field" htmlFor={`${id}-msg`}>
                Tu dedicatoria
                <textarea
                  ref={area}
                  id={`${id}-msg`}
                  className="hf-admin__input hf-dsleeve__area"
                  rows={5}
                  maxLength={500}
                  placeholder="Que este año sea tu mejor disco…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <div className="hf-dsleeve__row">
                <div className="hf-dsleeve__as" role="group" aria-label="Firmar como">
                  Firmar como
                  <button type="button" aria-pressed={!anonymous} onClick={() => setAnonymous(false)}>{me}</button>
                  <button type="button" aria-pressed={anonymous} onClick={() => setAnonymous(true)}>Anónimo</button>
                </div>
                <span className="hf-dsleeve__len">{text.length} / 500</span>
              </div>
              {error && <p className="hf-admin__error" role="alert">{error}</p>}
              <div className="hf-dsleeve__actions">
                <button type="button" className="hf-admin__btn" onClick={onClose}>Más tarde</button>
                <button type="button" className="hf-dsleeve__btn" disabled={busy || !text.trim()} onClick={save}>
                  {editing ? 'Guardar cambios' : 'Firmar y guardar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
