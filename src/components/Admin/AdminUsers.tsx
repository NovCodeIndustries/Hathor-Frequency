import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { adminApi, describeDevice, formatStamp, type AccessLogRow, type AdminSessionRow, type AdminUserRow, type NewAdminUser } from '../../lib/adminApi'
import { useAdmin } from '../../lib/useAdmin'
import './AdminSite.css'
import './AdminUsers.css'
import { useAdminLive } from '../../lib/useAdminLive'

/**
 * Usuarios del panel: cualquiera cambia su contraseña y ve o cierra sus sesiones; el usuario principal además
 * crea admins, les pone contraseña nueva (eso también quita el bloqueo por intentos), los borra
 * (el principal no se puede borrar) y ve el registro de accesos.
 */
export function AdminUsers() {
  const { admin, onError } = useAdmin()
  return (
    <>
      <title>{admin.isRoot ? 'Usuarios' : 'Mi cuenta'} · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">{admin.isRoot ? 'Usuarios' : 'Mi cuenta'}</h1>
          <p className="hf-admin__lead">
            {admin.isRoot
              ? 'Eres el usuario principal: puedes crear y quitar accesos al panel.'
              : 'Cambia tu contraseña. Para crear o quitar accesos, pídelo al usuario principal.'}
          </p>
        </div>
      </div>
      <div className="hf-ausers">
        {admin.isRoot && <UsersAdmin meId={admin.id} onError={onError} />}
        <MyPassword name={admin.name} email={admin.email} onError={onError} />
        <MySessions onError={onError} />
        {admin.isRoot && <AccessLog onError={onError} />}
      </div>
    </>
  )
}

function UsersAdmin({ meId, onError }: { meId: string; onError: (e: unknown) => string }) {
  const id = useId()
  const [list, setList] = useState<AdminUserRow[] | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const EMPTY: NewAdminUser & { repeat: string } = { firstName: '', middleName: '', lastName: '', secondLastName: '', phone: '', email: '', password: '', repeat: '' }
  const [form, setForm] = useState(EMPTY)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPwd, setResetPwd] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(() => {
    adminApi.users().then(setList).catch((err) => setError(onError(err)))
  }, [onError])
  useEffect(load, [load])
  useAdminLive(['users'], load)

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setError('')
    setMsg('')
    try {
      await fn()
      setMsg(ok)
      load()
      return true
    } catch (err) {
      setError(onError(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.repeat) return setError('Las contraseñas no coinciden.')
    const { repeat: _repeat, ...user } = form
    const clean = Object.fromEntries(Object.entries(user).map(([k, v]) => [k, k === 'password' ? v : String(v ?? '').trim()])) as unknown as NewAdminUser
    if (await run(() => adminApi.createUser(clean), `Usuario ${clean.email} creado.`)) {
      setForm(EMPTY)
      setShow(false)
    }
  }

  const target = list?.find((u) => u.id === deleteId)

  return (
    <>
      <section className="hf-ausers__card" aria-labelledby={`${id}-list`}>
        <h2 id={`${id}-list`} className="hf-ausers__title">Accesos al panel</h2>
        {error && <p className="hf-admin__error" role="alert">{error}</p>}
        {msg && <p className="hf-ausers__ok" role="status">{msg}</p>}
        <div className="hf-acontacts">
          <table className="hf-acontacts__table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo y teléfono</th>
                <th scope="col">Rol</th>
                <th scope="col">Alta</th>
                <th scope="col" className="hf-acontacts__right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list?.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === meId && <span className="hf-acontacts__muted"> (tú)</span>}</td>
                  <td data-label="Correo" className="hf-acontacts__muted">
                    {u.email}
                    {u.phone && <span className="hf-ausers__phone">{u.phone}</span>}
                  </td>
                  <td data-label="Rol">
                    {u.isRoot ? <span className="hf-chip hf-chip--done">Principal</span> : <span className="hf-chip hf-chip--tag">Admin</span>}
                    {u.lockedUntil && (
                      <span className="hf-chip hf-chip--pending hf-ausers__lock" title="Por intentos fallidos; una contraseña nueva lo quita">
                        Bloqueada hasta {formatStamp(u.lockedUntil).split(', ')[1]}
                      </span>
                    )}
                  </td>
                  <td data-label="Alta" className="hf-acontacts__muted">{formatStamp(u.createdAt)}</td>
                  <td className="hf-acontacts__right">
                    {resetId === u.id ? (
                      <form
                        className="hf-ausers__reset"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          if (await run(() => adminApi.setUserPassword(u.id, resetPwd), `Contraseña de ${u.email} cambiada.`)) {
                            setResetId(null)
                            setResetPwd('')
                          }
                        }}
                      >
                        <label className="sr-only" htmlFor={`${id}-reset-${u.id}`}>Contraseña nueva de {u.name}</label>
                        <input id={`${id}-reset-${u.id}`} className="hf-admin__input hf-ausers__reset-input" type="text" autoComplete="new-password" minLength={10} required placeholder="Contraseña nueva" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} />
                        <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={busy}>Guardar</button>
                        <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setResetId(null)}>Cancelar</button>
                      </form>
                    ) : (
                      <span className="hf-ausers__actions">
                        <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => (setResetId(u.id), setResetPwd(''))}>Cambiar contraseña</button>
                        {!u.isRoot && (
                          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setDeleteId(u.id)}>Quitar acceso</button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form className="hf-ausers__card" aria-labelledby={`${id}-new`} onSubmit={create}>
        <h2 id={`${id}-new`} className="hf-ausers__title">Nuevo usuario admin</h2>
        <div className="hf-ausers__grid">
          {(
            [
              ['firstName', 'Primer nombre', true, 'given-name'],
              ['middleName', 'Segundo nombre (opcional)', false, 'additional-name'],
              ['lastName', 'Primer apellido', true, 'family-name'],
              ['secondLastName', 'Segundo apellido (opcional)', false, 'off'],
            ] as const
          ).map(([key, label, required, auto]) => (
            <label key={key} className="hf-admin__field" htmlFor={`${id}-${key}`}>
              {label}
              <input id={`${id}-${key}`} className="hf-admin__input" required={required} maxLength={60} autoComplete={auto} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
          <label className="hf-admin__field" htmlFor={`${id}-phone`}>
            Teléfono
            <input id={`${id}-phone`} className="hf-admin__input" type="tel" inputMode="tel" required pattern="[0-9+()\s\-]{8,20}" title="Al menos 8 dígitos" placeholder="+52 55 0000 0000" autoComplete="off" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-email`}>
            Correo
            <input id={`${id}-email`} className="hf-admin__input" type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-pwd`}>
            Contraseña (mín. 10)
            <span className="hf-ausers__pwd">
              <input id={`${id}-pwd`} className="hf-admin__input" type={show ? 'text' : 'password'} required minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" aria-pressed={show} onClick={() => setShow((v) => !v)}>
                {show ? 'Ocultar' : 'Mostrar'}
              </button>
            </span>
          </label>
          <label className="hf-admin__field" htmlFor={`${id}-rep`}>
            Repite la contraseña
            <input
              id={`${id}-rep`}
              className={`hf-admin__input ${form.repeat && form.repeat !== form.password ? 'is-bad' : ''}`}
              type={show ? 'text' : 'password'}
              required
              autoComplete="new-password"
              aria-describedby={`${id}-match`}
              value={form.repeat}
              onChange={(e) => setForm({ ...form, repeat: e.target.value })}
            />
            <PasswordMatch id={`${id}-match`} a={form.password} b={form.repeat} />
          </label>
        </div>
        <p className="hf-ausers__muted">Comparte la contraseña por un medio seguro; podrá cambiarla en "Mi cuenta".</p>
        <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-ausers__submit" disabled={busy || form.password.length < 10 || form.password !== form.repeat}>Crear usuario</button>
      </form>

      {target && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setDeleteId(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby={`${id}-del`}>
            <h2 id={`${id}-del`} className="hf-asite__confirm-title">
              ¿Quitar el acceso a <span className="hf-asite__gold">{target.name}?</span>
            </h2>
            <p className="hf-ausers__muted">{target.email} ya no podrá entrar al panel y se cierran sus sesiones.</p>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button
                type="button"
                className="hf-admin__btn hf-admin__btn--primary"
                disabled={busy}
                onClick={async () => {
                  await run(() => adminApi.deleteUser(target.id), `Acceso de ${target.email} quitado.`)
                  setDeleteId(null)
                }}
              >
                Quitar acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MyPassword({ name, email, onError }: { name: string; email: string; onError: (e: unknown) => string }) {
  const id = useId()
  const [f, setF] = useState({ current: '', next: '', repeat: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (f.next !== f.repeat) return setError('Las contraseñas nuevas no coinciden.')
    setBusy(true)
    try {
      await adminApi.changeMyPassword(f.current, f.next)
      setF({ current: '', next: '', repeat: '' })
      setError('')
      setMsg('Contraseña cambiada.')
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="hf-ausers__card" aria-labelledby={`${id}-me`} onSubmit={submit}>
      <h2 id={`${id}-me`} className="hf-ausers__title">Mi cuenta</h2>
      <p className="hf-ausers__muted">{name} · {email}</p>
      <div className="hf-ausers__grid">
        <label className="hf-admin__field" htmlFor={`${id}-cur`}>
          Contraseña actual
          <input id={`${id}-cur`} className="hf-admin__input" type="password" required autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
        </label>
        <label className="hf-admin__field" htmlFor={`${id}-next`}>
          Nueva (mín. 10)
          <input id={`${id}-next`} className="hf-admin__input" type="password" required minLength={10} autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
        </label>
        <label className="hf-admin__field" htmlFor={`${id}-rep`}>
          Repite la nueva
          <input id={`${id}-rep`} className={`hf-admin__input ${f.repeat && f.repeat !== f.next ? 'is-bad' : ''}`} type="password" required minLength={10} autoComplete="new-password" aria-describedby={`${id}-match`} value={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.value })} />
          <PasswordMatch id={`${id}-match`} a={f.next} b={f.repeat} />
        </label>
      </div>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}
      {msg && <p className="hf-ausers__ok" role="status">{msg}</p>}
      <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-ausers__submit" disabled={busy || f.next.length < 10 || f.next !== f.repeat}>Cambiar contraseña</button>
    </form>
  )
}

/** Mis sesiones abiertas: dónde está abierta mi cuenta, y cerrar las que no reconozca */
function MySessions({ onError }: { onError: (e: unknown) => string }) {
  const id = useId()
  const [list, setList] = useState<AdminSessionRow[] | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    adminApi.mySessions().then(setList).catch((err) => setError(onError(err)))
  }, [onError])
  useEffect(load, [load])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg('')
    try {
      await fn()
      setError('')
      setMsg(ok)
      load()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  const others = list?.filter((s) => !s.current).length ?? 0

  return (
    <section className="hf-ausers__card" aria-labelledby={`${id}-sessions`}>
      <h2 id={`${id}-sessions`} className="hf-ausers__title">Sesiones abiertas</h2>
      <p className="hf-ausers__muted">Se cierran solas tras 12 h sin uso, o a los 7 días. Si ves una que no reconoces, ciérrala y cambia tu contraseña.</p>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}
      {msg && <p className="hf-ausers__ok" role="status">{msg}</p>}
      <ul className="hf-ausers__sessions">
        {list?.map((s) => (
          <li key={s.id} className="hf-ausers__session">
            <span>
              {describeDevice(s.userAgent)}
              {s.current && <span className="hf-chip hf-chip--done hf-ausers__here">Esta sesión</span>}
              <span className="hf-ausers__phone">
                {s.ip ?? 'IP desconocida'} · último uso {formatStamp(s.lastSeenAt)} · abierta {formatStamp(s.createdAt)}
              </span>
            </span>
            {!s.current && (
              <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" disabled={busy} onClick={() => run(() => adminApi.closeSession(s.id), 'Sesión cerrada.')}>
                Cerrar
              </button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <button type="button" className="hf-admin__btn hf-ausers__submit" disabled={busy} onClick={() => run(() => adminApi.closeOtherSessions(), 'Se cerraron las demás sesiones.')}>
          Cerrar las demás ({others})
        </button>
      )}
    </section>
  )
}

const REASON: Record<NonNullable<AccessLogRow['reason']>, string> = {
  password: 'Contraseña incorrecta',
  unknown: 'Correo sin cuenta',
  locked: 'Cuenta bloqueada',
}

/** Registro de accesos (solo el principal): los últimos 100 intentos de login, buenos y fallidos */
function AccessLog({ onError }: { onError: (e: unknown) => string }) {
  const id = useId()
  const [list, setList] = useState<AccessLogRow[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    adminApi.accessLog().then(setList).catch((err) => setError(onError(err)))
  }, [onError])
  useEffect(load, [load])
  useAdminLive(['users'], load)

  return (
    <section className="hf-ausers__card" aria-labelledby={`${id}-log`}>
      <h2 id={`${id}-log`} className="hf-ausers__title">Registro de accesos</h2>
      <p className="hf-ausers__muted">Últimos 100 intentos de entrar al panel; se guardan 90 días. Tras 5 fallidos seguidos, la cuenta se bloquea 15 min.</p>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}
      {list && list.length === 0 && <p className="hf-ausers__muted">Aún no hay intentos.</p>}
      {list && list.length > 0 && (
        <div className="hf-acontacts">
          <table className="hf-acontacts__table">
            <thead>
              <tr>
                <th scope="col">Cuándo</th>
                <th scope="col">Cuenta</th>
                <th scope="col">Resultado</th>
                <th scope="col">Desde</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="hf-acontacts__muted">{formatStamp(e.createdAt)}</td>
                  <td data-label="Cuenta">
                    {e.user?.name ?? e.email}
                    {e.user && <span className="hf-ausers__phone">{e.email}</span>}
                  </td>
                  <td data-label="Resultado">
                    {e.success ? <span className="hf-chip hf-chip--done">Entró</span> : <span className="hf-chip hf-chip--off">{e.reason ? REASON[e.reason] : 'Falló'}</span>}
                  </td>
                  <td data-label="Desde" className="hf-acontacts__muted">
                    {e.ip ?? 'IP desconocida'}
                    <span className="hf-ausers__phone">{describeDevice(e.userAgent)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** Mientras escribes: si las dos contraseñas coinciden */
function PasswordMatch({ id, a, b }: { id: string; a: string; b: string }) {
  if (!b) return <span id={id} className="hf-ausers__match">Escríbela otra vez.</span>
  const ok = a === b
  return (
    <span id={id} className={`hf-ausers__match ${ok ? 'is-ok' : 'is-bad'}`} role="status">
      {ok ? (a.length < 10 ? 'Coinciden, pero falta largo (mín. 10).' : 'Coinciden.') : 'No coinciden.'}
    </span>
  )
}
