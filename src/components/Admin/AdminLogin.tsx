import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { adminApi, type AdminUser } from '../../lib/adminApi'
import { celebratedToday, setPartyStage, startParty } from '../../lib/birthdayParty'
import { LoginAlien, type AlienMood } from './LoginAlien'
import './AdminLayout.css'
import './AdminLogin.css'

const ARC = 'M 550 10 A 540 540 0 0 1 1010 270'
/** Lo que dura el brinco del alien antes de entrar al panel */
const OK_DELAY_MS = 650

/**
 * Login del panel (diseño L1 + alien A4/M1): tarjeta centrada sobre los anillos de vinil.
 * En el cumpleaños de quien entra (una vez al día), el alien se pone el gorro y le canta (B3) antes del panel.
 */
export function AdminLogin() {
  const id = useId()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [mood, setMood] = useState<AlienMood>('listen')
  /** Cumpleaños: el nombre de quien entró (null = login normal) */
  const [party, setParty] = useState<string | null>(null)
  const [thanked, setThanked] = useState(false)
  /** Segundo paso (2FA): el pase del primer paso; null = pidiendo usuario y contraseña */
  const [ticket, setTicket] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ticket) codeRef.current?.focus()
  }, [ticket, recovery])
  const thanksRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (party) thanksRef.current?.focus()
  }, [party])
  // Al salir de un campo vuelve a escuchar música, salvo que ya esté de fiesta
  const listen = () => setMood((m) => (m === 'party' || m === 'ok' ? m : 'listen'))
  const next = params.get('next')
  const goIn = () => navigate(next?.startsWith('/admin') ? next : '/admin', { replace: true })

  const enter = (user: AdminUser) => {
    if (user.birthday && !celebratedToday(user.id)) {
      // Hoy cumple: el alien le canta; después el panel sigue con el pastel y los globos
      startParty(user.id)
      setParty(user.firstName || user.name)
      setMood('party')
      setSending(false)
      return
    }
    setMood('ok')
    setTimeout(goIn, OK_DELAY_MS)
  }

  const fail = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión')
    setMood('error')
    setSending(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await adminApi.login(username.trim(), password)
      if ('ticket' in res) {
        // Con 2FA: falta el código de su teléfono
        setTicket(res.ticket)
        setMood('listen')
        setSending(false)
        return
      }
      enter(res)
    } catch (err) {
      fail(err)
    }
  }

  const handleCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!ticket) return
    setSending(true)
    setError('')
    try {
      enter(await adminApi.loginCode(ticket, code))
    } catch (err) {
      fail(err)
      setCode('')
      // El pase venció: de vuelta a la contraseña
      if (err instanceof Error && /Vuelve a escribir/.test(err.message)) {
        setTicket(null)
        setPassword('')
      }
    }
  }

  const back = () => {
    setTicket(null)
    setCode('')
    setRecovery(false)
    setPassword('')
    setError('')
    setMood('listen')
  }

  return (
    <div className="hf-login">
      <title>Panel · Hathor Frequency</title>
      <meta name="robots" content="noindex" />
      <svg className="hf-login__rings" viewBox="0 0 1100 1100" fill="none" aria-hidden="true" focusable="false">
        {[540, 480, 420, 360].map((r, i) => (
          <circle key={r} cx="550" cy="550" r={r} stroke="currentColor" strokeOpacity={0.1 + i * 0.03} />
        ))}
        <path d={ARC} stroke="currentColor" strokeOpacity=".6" strokeWidth="2" />
      </svg>

      <div className={`hf-login__stage ${party ? 'is-party' : ''}`}>
        <LoginAlien mood={mood} />

        {party && (
          <p className="hf-login__bubble" aria-live="polite">
            {thanked ? (
              <>
                ¡De nada! <span>Hoy mando yo los beats.</span>
              </>
            ) : (
              <>
                ♪ Feliz cumpleaños, <span>{party}</span> ♪<small>Te la canto desde Andrómeda.</small>
              </>
            )}
          </p>
        )}

        {party ? (
          <div className="hf-login__card hf-login__party">
            <div className="hf-login__brand">
              <span className="hf-login__logo">HATHOR</span>
              <span className="hf-login__kicker">Hoy es tu cumpleaños</span>
            </div>
            <h1 className="hf-login__party-title">
              ¡Felicidades, <span>{party}!</span>
            </h1>
            <p className="hf-login__help">El estudio entero te desea un año lleno de buenas tomas.</p>
            <button
              ref={thanksRef}
              type="button"
              className="hf-login__submit"
              disabled={thanked}
              onClick={() => {
                setThanked(true)
                setMood('ok')
                setTimeout(goIn, OK_DELAY_MS * 2)
              }}
            >
              Gracias, alien
            </button>
            <button
              type="button"
              className="hf-login__skip"
              onClick={() => {
                setPartyStage(null)
                goIn()
              }}
            >
              Saltar el festejo
            </button>
          </div>
        ) : ticket ? (
        <form className="hf-login__card" onSubmit={handleCode}>
          <div className="hf-login__brand">
            <span className="hf-login__logo">HATHOR</span>
            <span className="hf-login__sub">FREQUENCY</span>
            <span className="hf-login__kicker">Verificación en dos pasos</span>
          </div>

          <label className="hf-admin__field" htmlFor={`${id}-code`}>
            {recovery ? 'Código de respaldo' : 'Código de tu app'}
            <input
              ref={codeRef}
              id={`${id}-code`}
              key={recovery ? 'recovery' : 'app'}
              className={`hf-admin__input hf-login__input ${recovery ? '' : 'hf-login__code'}`}
              inputMode={recovery ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={recovery ? 'k7pq-x9wm' : '000000'}
              required
              maxLength={recovery ? 12 : 7}
              value={code}
              onChange={(e) => setCode(recovery ? e.target.value : e.target.value.replace(/[^\d ]/g, ''))}
              onFocus={() => setMood('pass')}
              onBlur={listen}
            />
          </label>
          <p className="hf-login__help hf-login__help--left">
            {recovery ? 'Cada código de respaldo sirve una sola vez.' : 'Abre Google Authenticator o Authy y escribe el código de Hathor Frequency.'}
          </p>

          <p className="hf-login__error" role="status">{error}</p>

          <button type="submit" className="hf-login__submit" disabled={sending}>
            {sending ? 'Revisando…' : 'Verificar'}
          </button>

          <button
            type="button"
            className="hf-login__skip"
            onClick={() => {
              setRecovery((r) => !r)
              setCode('')
              setError('')
            }}
          >
            {recovery ? 'Usar el código de la app' : '¿Perdiste tu teléfono? Usa un código de respaldo'}
          </button>
          <button type="button" className="hf-login__skip" onClick={back}>
            Volver
          </button>
        </form>
        ) : (
        <form className="hf-login__card" onSubmit={handleSubmit}>
          <div className="hf-login__brand">
            <span className="hf-login__logo">HATHOR</span>
            <span className="hf-login__sub">FREQUENCY</span>
            <span className="hf-login__kicker">Panel del estudio</span>
          </div>

          <label className="hf-admin__field" htmlFor={`${id}-user`}>
            Usuario
            <input
              id={`${id}-user`}
              className="hf-admin__input hf-login__input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="jnunez"
              required
              maxLength={60}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setMood('email')}
              onBlur={listen}
            />
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-password`}>
            Contraseña
            <input
              id={`${id}-password`}
              className="hf-admin__input hf-login__input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setMood('pass')}
              onBlur={listen}
            />
          </label>

          <p className="hf-login__error" role="status">{error}</p>

          <button type="submit" className="hf-login__submit" disabled={sending}>
            {sending ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="hf-login__help">¿Sin acceso? Pídelo a quien administra el estudio.</p>
        </form>
        )}
      </div>

    </div>
  )
}
