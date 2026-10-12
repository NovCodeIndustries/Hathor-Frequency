import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatClock } from '../../lib/time'
import type { Dedication } from '../../lib/adminApi'
import './Dedications.css'

/**
 * L1 · Una a una: quien cumple lee las dedicatorias del equipo, una carta a la vez con Anterior / Siguiente.
 * Al cerrar avisa cuáles alcanzó a ver (para marcarlas leídas).
 */
export function DedicationsReader({ name, items, onDone }: { name: string; items: Dedication[]; onDone: (seen: string[]) => void }) {
  const [i, setI] = useState(0)
  const [seenUpTo, setSeenUpTo] = useState(0)
  const main = useRef<HTMLButtonElement>(null)
  const total = items.length
  const finished = i >= total
  const current = items[Math.min(i, total - 1)]

  const close = () => onDone(items.slice(0, Math.max(seenUpTo, Math.min(i, total - 1)) + 1).map((d) => d.id))
  const go = (n: number) => {
    setI(n)
    setSeenUpTo((s) => Math.max(s, Math.min(n, total - 1)))
  }

  useEffect(() => main.current?.focus(), [i])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' && !finished) go(i + 1)
      else if (e.key === 'ArrowLeft' && i > 0) go(i - 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return createPortal(
    <div className="hf-dreader" role="dialog" aria-modal="true" aria-labelledby="dreader-title">
      <button type="button" className="hf-bcake__skip" onClick={close}>Leer después</button>
      <div className="hf-dreader__body">
        <div className="hf-dreader__head">
          <span className="hf-bcake__kick">{finished ? 'Dedicatorias leídas' : `Dedicatoria ${i + 1} de ${total}`}</span>
          <h1 id="dreader-title" className="hf-dreader__title">
            El equipo te escribió, <span>{name}.</span>
          </h1>
        </div>

        <div className="hf-dreader__stack">
          <div className="hf-dreader__under hf-dreader__under--a" aria-hidden="true" />
          <div className="hf-dreader__under hf-dreader__under--b" aria-hidden="true" />
          {finished ? (
            <article key="end" className="hf-dreader__card hf-dreader__card--end">
              <h2>Eso es todo… por ahora.</h2>
              <p>Leíste {total === 1 ? 'la dedicatoria' : `las ${total} dedicatorias`}. Si llegan más hoy, te avisamos en el panel.</p>
            </article>
          ) : (
            <article key={current.id} className="hf-dreader__card" aria-live="polite">
              <svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true">
                <path d="M2 26 V16 C2 7 7 2 14 1 V6 C9 8 8 11 8 14 H14 V26Z M20 26 V16 C20 7 25 2 32 1 V6 C27 8 26 11 26 14 H32 V26Z" fill="#F2C94C" fillOpacity=".6" />
              </svg>
              <p className="hf-dreader__text">{current.text}</p>
              <div className="hf-dreader__by">
                <span>— {current.from}</span>
                <span className="hf-dreader__when">{formatClock(new Date(current.createdAt))}</span>
              </div>
            </article>
          )}
        </div>

        <div className="hf-dreader__dots" aria-hidden="true">
          {items.map((d, k) => (
            <span key={d.id} className={`${k <= i ? 'is-on' : ''} ${k === i ? 'is-now' : ''}`} />
          ))}
        </div>

        <div className="hf-dreader__nav">
          {finished ? (
            <>
              <button type="button" className="hf-admin__btn" onClick={() => go(0)}>Leer otra vez</button>
              <button ref={main} type="button" className="hf-bparty__btn" onClick={close}>Entrar al panel</button>
            </>
          ) : (
            <>
              <button type="button" className="hf-admin__btn" disabled={i === 0} onClick={() => go(i - 1)}>Anterior</button>
              <button ref={main} type="button" className="hf-bparty__btn" onClick={() => go(i + 1)}>{i === total - 1 ? 'Terminar' : 'Siguiente'}</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
