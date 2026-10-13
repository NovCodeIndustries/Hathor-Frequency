import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { adminApi, type TwoFactorSetup as Setup } from '../../lib/adminApi'
import './TwoFactor.css'

interface TwoFactorSetupProps {
  /** `gate`: pantalla completa obligatoria (Admin sin 2FA) · `modal`: ventana desde Mi cuenta o el aviso */
  mode: 'gate' | 'modal'
  username: string
  onDone: () => void
  onCancel?: () => void
  onLogout?: () => void
  onError: (err: unknown) => string
}

/**
 * Activar la verificación en dos pasos: 1) escanear el QR con la app (o escribir la clave), 2) confirmar con un
 * código y 3) guardar los 8 códigos de respaldo, que solo se muestran esta vez.
 */
export function TwoFactorSetup({ mode, username, onDone, onCancel, onLogout, onError }: TwoFactorSetupProps) {
  const id = useId()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'key' | 'codes' | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)

  useEffect(() => {
    // Una sola clave por apertura (en desarrollo React monta dos veces)
    if (started.current) return
    started.current = true
    adminApi
      .twoFactorSetup()
      .then(setSetup)
      .catch((err) => setError(onError(err)))
  }, [onError])

  useEffect(() => {
    if (mode !== 'modal' || !onCancel || codes) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, onCancel, codes])

  const enable = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      setCodes((await adminApi.twoFactorEnable(code)).codes)
    } catch (err) {
      setError(onError(err))
      setCode('')
      codeRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  const copy = async (what: 'key' | 'codes', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // sin portapapeles: se copia a mano
    }
  }

  const card = (
    <div className="hf-2fa__card" role={mode === 'modal' ? 'dialog' : undefined} aria-modal={mode === 'modal' || undefined} aria-labelledby={`${id}-title`}>
      <span className="hf-2fa__kicker">Verificación en dos pasos</span>
      {codes ? (
        <RecoveryCodes
          titleId={`${id}-title`}
          codes={codes}
          username={username}
          saved={saved}
          copied={copied === 'codes'}
          onSaved={setSaved}
          onCopy={() => copy('codes', codes.join('\n'))}
          onDone={onDone}
        />
      ) : (
        <>
          <h2 id={`${id}-title`} className="hf-2fa__title">
            {mode === 'gate' ? (
              <>
                Protege <span>el panel.</span>
              </>
            ) : (
              <>
                Activa tu <span>segundo paso.</span>
              </>
            )}
          </h2>
          <p className="hf-2fa__text">
            {mode === 'gate'
              ? 'Quienes son Admin entran con su contraseña y un código de 6 dígitos de su teléfono. Actívalo para seguir usando el panel.'
              : 'Al entrar, además de tu contraseña te pediremos un código de 6 dígitos de tu teléfono.'}
          </p>

          <ol className="hf-2fa__steps">
            <li>
              <span className="hf-2fa__num">1</span>
              <span>
                Instala en tu teléfono <strong>Google Authenticator</strong> o <strong>Authy</strong> (gratis, para iPhone y Android), toca “+” y escanea este código.
              </span>
            </li>
          </ol>
          <div className="hf-2fa__qr-row">
            <div className="hf-2fa__qr" aria-busy={!setup}>
              {setup ? <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr)}`} alt="Código QR para la app autenticadora" width={184} height={184} /> : <span>Generando…</span>}
            </div>
            <div className="hf-2fa__key">
              <span className="hf-2fa__key-label">¿No puedes escanear? Escribe esta clave:</span>
              <code className="hf-2fa__key-value">{setup?.secret ?? '····'}</code>
              <span className="hf-2fa__key-label">Cuenta: Hathor Frequency · {username}</span>
              {setup && (
                <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => copy('key', setup.secret.replace(/\s/g, ''))}>
                  {copied === 'key' ? 'Copiada' : 'Copiar clave'}
                </button>
              )}
            </div>
          </div>

          <form className="hf-2fa__confirm" onSubmit={enable}>
            <label className="hf-2fa__step" htmlFor={`${id}-code`}>
              <span className="hf-2fa__num">2</span>
              <span>Escribe el código de 6 dígitos que te muestra la app.</span>
            </label>
            <div className="hf-2fa__code-row">
              <input
                ref={codeRef}
                id={`${id}-code`}
                className="hf-admin__input hf-2fa__code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,7}"
                maxLength={7}
                placeholder="000000"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
              />
              <button type="submit" className="hf-admin__btn hf-admin__btn--primary" disabled={busy || !setup || code.replace(/\s/g, '').length !== 6}>
                {busy ? 'Revisando…' : 'Activar'}
              </button>
            </div>
            {error && <p className="hf-admin__error" role="alert">{error}</p>}
          </form>

          <div className="hf-2fa__foot">
            {mode === 'modal' && onCancel && (
              <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={onCancel}>Ahora no</button>
            )}
            {mode === 'gate' && onLogout && (
              <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={onLogout}>Cerrar sesión</button>
            )}
          </div>
        </>
      )}
    </div>
  )

  if (mode === 'gate') return <div className="hf-2fa hf-2fa--gate">{card}</div>
  return createPortal(
    <div className="hf-2fa hf-2fa--modal">
      <button type="button" className="hf-2fa__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={codes ? undefined : onCancel} />
      {card}
    </div>,
    document.body,
  )
}

/** Paso 3: los códigos de respaldo (también al generarlos de nuevo desde Mi cuenta) */
export function RecoveryCodes({ titleId, codes, username, saved, copied, onSaved, onCopy, onDone }: {
  titleId: string
  codes: string[]
  username: string
  saved: boolean
  copied: boolean
  onSaved: (v: boolean) => void
  onCopy: () => void
  onDone: () => void
}) {
  const download = () => {
    const text = `Hathor Frequency · Panel del estudio\nCódigos de respaldo de ${username} (cada uno sirve una sola vez)\n\n${codes.join('\n')}\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `hathor-codigos-${username}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <h2 id={titleId} className="hf-2fa__title">
        Guarda tus <span>códigos de respaldo.</span>
      </h2>
      <p className="hf-2fa__text">
        Si pierdes tu teléfono, entras con uno de estos códigos. Cada uno sirve una sola vez y <strong>no los vas a volver a ver</strong>: guárdalos en un lugar seguro.
      </p>
      <ul className="hf-2fa__codes" aria-label="Códigos de respaldo">
        {codes.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ul>
      <div className="hf-2fa__code-actions">
        <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={onCopy}>{copied ? 'Copiados' : 'Copiar'}</button>
        <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={download}>Descargar .txt</button>
      </div>
      <label className="hf-2fa__saved">
        <input type="checkbox" checked={saved} onChange={(e) => onSaved(e.target.checked)} />
        Ya los guardé en un lugar seguro
      </label>
      <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={!saved} onClick={onDone}>
        Listo
      </button>
    </>
  )
}
