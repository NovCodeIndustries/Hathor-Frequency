import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { panelViews, viewsText } from '../../data/panelViews'
import { createPortal } from 'react-dom'
import { adminApi, type AdminUser } from '../../lib/adminApi'
import './PanelWelcome.css'

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Lo que ve cada rol en el panel (Pista 2) */
/** Lo que ve un Staff: sus vistas (panel · Usuarios) y Mi cuenta */
const staffAreas = (views: string[]) => [
  ...panelViews.filter((v) => views.includes(v.id)).map((v) => ({ name: v.label, text: `${v.hint}.` })),
  { name: 'Mi cuenta', text: 'Tu contraseña y tus sesiones abiertas.' },
]

const AREAS = {
  ADMIN: [
    { name: 'Inicio', text: 'El resumen del día: sesiones, pendientes, ingresos y visitas.' },
    { name: 'Agenda', text: 'Reservas, bloqueos y sesiones agendadas por el estudio.' },
    { name: 'Opiniones y Contactos', text: 'Publica opiniones y atiende a quien escribe.' },
    { name: 'Sitio y Contenido', text: 'Lo que se ve en la web: módulos, textos, precios y artistas.' },
  ],
} as const

function Alien({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.84} viewBox="-15 -12 150 114" aria-hidden="true">
      <path d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" fill="#2a2d31" stroke="#F2C94C" strokeWidth="2" />
      <path d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z" fill="#000" stroke="#F2C94C" strokeWidth="2" />
      <path d="M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" fill="#000" stroke="#F2C94C" strokeWidth="2" />
      <circle cx="40" cy="46" r="2.3" fill="#fff" />
      <circle cx="80" cy="46" r="2.3" fill="#fff" />
      <path d="M14 52 C12 -12 108 -12 106 52" fill="none" stroke="#F2C94C" strokeWidth="5" strokeLinecap="round" />
      <rect x="6" y="36" width="20" height="34" rx="9" fill="#111" stroke="#F2C94C" strokeWidth="2" />
      <rect x="94" y="36" width="20" height="34" rx="9" fill="#111" stroke="#F2C94C" strokeWidth="2" />
    </svg>
  )
}

/**
 * Bienvenida de un usuario nuevo (W5 escritorio · M2 móvil, canvas https://claude.ai/artifact/NdDtgvn3anghmrwcDyHJfu):
 * el pase de estudio que cae y se activa (W1), y el tour en tres pistas (W2): tu pase, lo que vas a usar según tu rol
 * y tu contraseña. Sale mientras tenga contraseña temporal (`mustChangePassword`) y no se salta: hay que poner la suya.
 */
export function PanelWelcome({ admin, onDone, onLogout, onError }: { admin: AdminUser; onDone: () => void; onLogout: () => void; onError: (e: unknown) => string }) {
  const id = useId()
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const main = useRef<HTMLButtonElement>(null)
  const pwd = useRef<HTMLInputElement>(null)

  useEffect(() => (step === 2 ? pwd.current : main.current)?.focus(), [step, active])

  const role = admin.role === 'STAFF' ? 'STAFF' : 'ADMIN'
  const roleLabel = role === 'STAFF' ? 'Staff' : 'Admin'
  const first = admin.firstName || admin.name
  const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.name
  // El pase es "desde hoy": su primer día en el panel
  const [sinceLabel] = useState(() => {
    const d = new Date()
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
  })
  const ok = a.length >= 10 && a === b
  const steps = [
    ['Tu pase', 'Quién eres aquí'],
    ['Lo que vas a usar', role === 'STAFF' ? viewsText(admin.views) : 'Todo el panel'],
    ['Tu contraseña', 'Hazla tuya'],
  ]

  const save = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!ok) return
    setBusy(true)
    try {
      await adminApi.setFirstPassword(a)
      setError('')
      setStep(3)
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (step === 0 && !active) return setActive(true)
    if (step === 2) return void save()
    if (step === 3) return onDone()
    setStep(step + 1)
  }
  const nextLabel = step === 0 ? (active ? 'Siguiente' : 'Activar mi pase') : step === 2 ? 'Guardar y terminar' : step === 3 ? 'Entrar al panel' : 'Siguiente'
  const counter = step === 3 ? 'Listo' : `${step + 1} de 3`

  return createPortal(
    <div className="hf-welcome" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <aside className="hf-welcome__side" aria-label="Pasos">
        <div className="hf-welcome__brand">
          <span className="hf-welcome__logo">HATHOR</span>
          <span className="hf-welcome__kick">Tu primer día</span>
          <span className="hf-welcome__counter">{counter}</span>
        </div>
        {step > 0 && (
          <div className="hf-welcome__mini">
            <Alien size={44} />
            <span className="hf-welcome__mini-text">
              <span className="hf-welcome__mini-name">{name}</span>
              <span className="hf-welcome__mini-user">
                {admin.username} · {roleLabel}
              </span>
            </span>
            <span className="hf-welcome__mini-stamp" aria-hidden="true">Activo</span>
          </div>
        )}
        <ol className="hf-welcome__steps">
          {steps.map(([title, sub], i) => {
            const done = i < step || step === 3 || (i === 0 && active)
            return (
              <li key={title} className={`hf-welcome__step ${i === step ? 'is-now' : ''} ${i > step && step < 3 ? 'is-next' : ''}`} aria-current={i === step ? 'step' : undefined}>
                <span className={`hf-welcome__dot ${done ? 'is-done' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="hf-welcome__step-text">
                  <span>{title}</span>
                  <span className="hf-welcome__sub">{sub}</span>
                </span>
              </li>
            )
          })}
        </ol>
        <button type="button" className="hf-welcome__logout" onClick={onLogout}>Cerrar sesión</button>
      </aside>

      <main className="hf-welcome__main">
        {step === 0 && (
          <div className="hf-welcome__pass-step">
            <div className="hf-welcome__hang">
              <span className="hf-welcome__lanyard" aria-hidden="true" />
              <div className="hf-welcome__pass">
                <div className="hf-welcome__sway">
                  <span className="hf-welcome__clip" aria-hidden="true" />
                  <article className="hf-welcome__card" aria-label={`Pase de estudio de ${name}`}>
                    <span className="hf-welcome__shine" aria-hidden="true" />
                    <div className="hf-welcome__card-top">
                      <span className="hf-welcome__card-logo">
                        HATHOR<small>FREQUENCY</small>
                      </span>
                      <span className="hf-welcome__role">{roleLabel}</span>
                    </div>
                    <div className="hf-welcome__portrait">
                      <Alien size={116} />
                    </div>
                    <div className="hf-welcome__who">
                      <span className="hf-welcome__label">Pase de estudio</span>
                      <span className="hf-welcome__name">{name}</span>
                    </div>
                    <dl className="hf-welcome__meta">
                      <div>
                        <dt>Usuario</dt>
                        <dd className="is-gold">{admin.username}</dd>
                      </div>
                      <div>
                        <dt>Desde</dt>
                        <dd>{sinceLabel}</dd>
                      </div>
                    </dl>
                    {active && <span className="hf-welcome__stamp" aria-hidden="true">Activo</span>}
                  </article>
                </div>
              </div>
            </div>
            <div className="hf-welcome__copy hf-welcome__in">
              <span className="hf-welcome__eyebrow">Pista 1 · Tu pase</span>
              <h1 id={`${id}-title`} className="hf-welcome__title">
                Ya eres parte del <span>estudio, {first}.</span>
              </h1>
              <p className="hf-welcome__text">
                Este es tu pase: con tu usuario <strong>{admin.username}</strong> entras siempre. Actívalo y te mostramos lo tuyo en dos minutos.
              </p>
              {active && <p className="hf-welcome__ok">Pase activo.</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="hf-welcome__in hf-welcome__block">
            <span className="hf-welcome__eyebrow">Pista 2 · Lo que vas a usar</span>
            <h2 className="hf-welcome__title hf-welcome__title--md">
              Tu parte del <span>estudio.</span>
            </h2>
            <p className="hf-welcome__text">
              {role === 'STAFF'
                ? 'Te dieron estas partes del panel; si necesitas otra, pídela a quien administra el estudio:'
                : 'Llevas todo el estudio y lo que se ve en la web. Esto es lo que vas a ver en el panel:'}
            </p>
            <div className="hf-welcome__areas">
              {(role === 'STAFF' ? staffAreas(admin.views) : AREAS.ADMIN).map((x) => (
                <div key={x.name} className="hf-welcome__area">
                  <span className="hf-welcome__area-name">{x.name}</span>
                  <span>{x.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="hf-welcome__in hf-welcome__block hf-welcome__form" onSubmit={save}>
            <span className="hf-welcome__eyebrow">Pista 3 · Hazla tuya</span>
            <h2 className="hf-welcome__title hf-welcome__title--md">
              Ponle tu <span>contraseña.</span>
            </h2>
            <p className="hf-welcome__text">La que te dieron es temporal. Elige una solo tuya, de al menos 10 caracteres.</p>
            {/* Para que el gestor de contraseñas la guarde con tu usuario */}
            <input type="text" name="username" autoComplete="username" value={admin.username} readOnly hidden />
            <label className="hf-admin__field" htmlFor={`${id}-a`}>
              Contraseña nueva
              <input ref={pwd} id={`${id}-a`} className="hf-admin__input hf-welcome__input" type="password" autoComplete="new-password" minLength={10} maxLength={200} value={a} onChange={(e) => setA(e.target.value)} />
            </label>
            <label className="hf-admin__field" htmlFor={`${id}-b`}>
              Repítela
              <input id={`${id}-b`} className={`hf-admin__input hf-welcome__input ${b && b !== a ? 'is-bad' : ''}`} type="password" autoComplete="new-password" maxLength={200} value={b} onChange={(e) => setB(e.target.value)} />
            </label>
            <span className={`hf-welcome__match ${ok ? 'is-ok' : ''}`} role="status">
              {!b ? 'Escríbela otra vez.' : ok ? 'Coinciden.' : a === b ? 'Coinciden, pero falta largo (mín. 10).' : 'No coinciden.'}
            </span>
            {error && <p className="hf-admin__error" role="alert">{error}</p>}
            <button type="submit" hidden />
          </form>
        )}

        {step === 3 && (
          <div className="hf-welcome__in hf-welcome__block">
            <span className="hf-welcome__eyebrow">Listo</span>
            <h2 className="hf-welcome__title">
              Que suene, <span>{first}.</span>
            </h2>
            <p className="hf-welcome__text">Tu pase está activo y tu contraseña quedó guardada. Desde ahora entras con {admin.username} y tu contraseña.</p>
          </div>
        )}

        <div className="hf-welcome__nav">
          {step > 0 && step < 3 && (
            <button type="button" className="hf-welcome__back" onClick={() => setStep(step - 1)} aria-label="Paso anterior">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M10 3 5 8l5 5" />
              </svg>
              <span>Anterior</span>
            </button>
          )}
          <button ref={main} type="button" className="hf-welcome__next" disabled={busy || (step === 2 && !ok)} onClick={next}>
            {nextLabel}
          </button>
        </div>
      </main>
    </div>,
    document.body,
  )
}
