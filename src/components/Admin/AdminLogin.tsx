import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { adminApi } from '../../lib/adminApi'
import { LoginAlien, type AlienMood } from './LoginAlien'
import './AdminLayout.css'
import './AdminLogin.css'

const ARC = 'M 550 10 A 540 540 0 0 1 1010 270'
/** Lo que dura el brinco del alien antes de entrar al panel */
const OK_DELAY_MS = 650

/** Login del panel (diseño L1 + alien A4/M1): tarjeta centrada sobre los anillos de vinil */
export function AdminLogin() {
  const id = useId()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [mood, setMood] = useState<AlienMood>('listen')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await adminApi.login(email.trim(), password)
      setMood('ok')
      const next = params.get('next')
      setTimeout(() => navigate(next?.startsWith('/admin') ? next : '/admin', { replace: true }), OK_DELAY_MS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión')
      setMood('error')
      setSending(false)
    }
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

      <div className="hf-login__stage">
        <LoginAlien mood={mood} />

        <form className="hf-login__card" onSubmit={handleSubmit}>
          <div className="hf-login__brand">
            <span className="hf-login__logo">HATHOR</span>
            <span className="hf-login__sub">FREQUENCY</span>
            <span className="hf-login__kicker">Panel del estudio</span>
          </div>

          <label className="hf-admin__field" htmlFor={`${id}-email`}>
            Correo
            <input
              id={`${id}-email`}
              className="hf-admin__input hf-login__input"
              type="email"
              autoComplete="username"
              placeholder="tu@hathorfrequency.mx"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setMood('email')}
              onBlur={() => setMood('listen')}
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
              onBlur={() => setMood('listen')}
            />
          </label>

          <p className="hf-login__error" role="status">{error}</p>

          <button type="submit" className="hf-login__submit" disabled={sending}>
            {sending ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="hf-login__help">¿Sin acceso? Pídelo a quien administra el estudio.</p>
        </form>
      </div>

      <Link to="/" className="hf-login__back">← Volver al sitio</Link>
    </div>
  )
}
