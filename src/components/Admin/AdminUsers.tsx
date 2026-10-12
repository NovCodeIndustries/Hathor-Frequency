import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ROLE_HINT, ROLE_LABEL, adminApi, describeDevice, formatStamp, type AccessLogRow, type AdminRole, type AdminSessionRow, type AdminUserProfile, type AdminUserRow, type NewAdminUser } from '../../lib/adminApi'
import { staffUsername } from '../../data/staff'
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
  const { admin, onError, refreshMe } = useAdmin()
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
        {admin.isRoot && <UsersAdmin meId={admin.id} onError={onError} onSelfEdited={refreshMe} />}
        <MyPassword name={admin.name} username={admin.username} onError={onError} />
        <MySessions onError={onError} />
        {admin.isRoot && <AccessLog onError={onError} />}
      </div>
    </>
  )
}

function UsersAdmin({ meId, onError, onSelfEdited }: { meId: string; onError: (e: unknown) => string; onSelfEdited: () => void }) {
  const id = useId()
  const [list, setList] = useState<AdminUserRow[] | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const EMPTY: NewAdminUser = { firstName: '', middleName: '', lastName: '', secondLastName: '', phone: '', role: 'ADMIN', birthDate: '' }
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  /** La temporal recién generada (alta o "Nueva temporal"), para mostrarla con su botón de copiar */
  const [fresh, setFresh] = useState<{ username: string; temp: string } | null>(null)
  const [renewId, setRenewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(() => {
    adminApi.users().then(setList).catch((err) => setError(onError(err)))
  }, [onError])
  useEffect(load, [load])
  useAdminLive(['users'], load)

  const run = async <T,>(fn: () => Promise<T>, ok: string | ((result: T) => string)) => {
    setBusy(true)
    setError('')
    setMsg('')
    try {
      const result = await fn()
      setMsg(typeof ok === 'function' ? ok(result) : ok)
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
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v ?? '').trim()])) as unknown as NewAdminUser
    clean.birthDate = clean.birthDate || null
    let created: AdminUserRow | null = null
    if (await run(async () => (created = await adminApi.createUser(clean)), (u) => `Usuario creado: ${u.username}`)) {
      setForm(EMPTY)
      const u = created as AdminUserRow | null
      if (u?.tempPassword) setFresh({ username: u.username, temp: u.tempPassword })
    }
  }

  const target = list?.find((u) => u.id === deleteId)
  const editing = list?.find((u) => u.id === editId)
  const renewing = list?.find((u) => u.id === renewId)
  const newUsername = staffUsername(form.firstName, form.lastName)

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
                <th scope="col">Usuario y teléfono</th>
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
                    {u.username}
                    {u.phone && <span className="hf-ausers__phone">{u.phone}</span>}
                    {u.birthDate && <span className="hf-ausers__phone">Cumpleaños: {birthdayLabel(u.birthDate)}</span>}
                    {u.mustChangePassword && (
                      u.tempPassword ? (
                        <TempPassword value={u.tempPassword} />
                      ) : (
                        <span className="hf-ausers__phone">Con contraseña temporal (genera otra si la perdieron)</span>
                      )
                    )}
                  </td>
                  <td data-label="Rol">
                    {u.isRoot ? (
                      <span className="hf-chip hf-chip--done">Principal</span>
                    ) : (
                      <span className={`hf-chip ${u.role === 'STAFF' ? 'hf-chip--off' : 'hf-chip--tag'}`} title={ROLE_HINT[u.role]}>{ROLE_LABEL[u.role]}</span>
                    )}
                    {u.lockedUntil && (
                      <span className="hf-chip hf-chip--pending hf-ausers__lock" title="Por intentos fallidos; una contraseña nueva lo quita">
                        Bloqueada hasta {formatStamp(u.lockedUntil).split(', ')[1]}
                      </span>
                    )}
                  </td>
                  <td data-label="Alta" className="hf-acontacts__muted">{formatStamp(u.createdAt)}</td>
                  <td className="hf-acontacts__right">
                    <span className="hf-ausers__actions">
                      <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => setEditId(u.id)}>Editar</button>
                      {u.id !== meId && (
                        <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => setRenewId(u.id)}>Nueva temporal</button>
                      )}
                      {!u.isRoot && (
                        <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setDeleteId(u.id)}>Quitar acceso</button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form className="hf-ausers__card" aria-labelledby={`${id}-new`} onSubmit={create}>
        <h2 id={`${id}-new`} className="hf-ausers__title">Nuevo usuario</h2>
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
          <div className="hf-admin__field">
            Usuario
            <output className={`hf-ausers__email ${newUsername ? '' : 'is-empty'}`} aria-live="polite">
              {newUsername || 'Se arma con el nombre y el apellido'}
            </output>
            <span className="hf-ausers__match">Inicial del primer nombre + primer apellido. Si ya existe, se le agrega un número.</span>
          </div>
          <BirthDateField value={form.birthDate ?? ''} onChange={(birthDate) => setForm({ ...form, birthDate })} />
          <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} />
        </div>
        <p className="hf-ausers__muted">La contraseña se genera sola y es temporal: la ves aquí hasta que la persona entre y ponga la suya en la bienvenida.</p>
        <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-ausers__submit" disabled={busy}>Crear usuario</button>
      </form>

      {fresh && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setFresh(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby={`${id}-fresh`}>
            <h2 id={`${id}-fresh`} className="hf-asite__confirm-title">
              Acceso para <span className="hf-asite__gold">{fresh.username}</span>
            </h2>
            <p className="hf-ausers__muted">Dale estos datos por un medio seguro. Al entrar, la bienvenida le pide poner su propia contraseña; mientras tanto la sigues viendo en la tabla.</p>
            <dl className="hf-ausers__creds">
              <div><dt>Usuario</dt><dd>{fresh.username}</dd></div>
              <div><dt>Contraseña temporal</dt><dd><TempPassword value={fresh.temp} big /></dd></div>
            </dl>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn hf-admin__btn--primary" onClick={() => setFresh(null)}>Listo</button>
            </div>
          </div>
        </div>
      )}

      {renewing && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setRenewId(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby={`${id}-renew`}>
            <h2 id={`${id}-renew`} className="hf-asite__confirm-title">
              ¿Nueva contraseña temporal para <span className="hf-asite__gold">{renewing.username}?</span>
            </h2>
            <p className="hf-ausers__muted">La que tiene deja de servir, se cierran sus sesiones y se le quita el bloqueo si lo tenía. Al entrar con la nueva, le pedimos poner la suya.</p>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setRenewId(null)}>Cancelar</button>
              <button
                type="button"
                className="hf-admin__btn hf-admin__btn--primary"
                disabled={busy}
                onClick={async () => {
                  const who = renewing
                  let temp = ''
                  if (await run(async () => (temp = (await adminApi.newTempPassword(who.id)).tempPassword), `Nueva temporal para ${who.username}.`)) {
                    setRenewId(null)
                    setFresh({ username: who.username, temp })
                  }
                }}
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditUser
          user={editing}
          busy={busy}
          onCancel={() => setEditId(null)}
          onSave={async (profile) => {
            const ok = await run(() => adminApi.updateUser(editing.id, profile), (u) =>
              u.username !== editing.username ? `Datos de ${u.name} guardados. Su usuario ahora es ${u.username}.` : `Datos de ${u.name} guardados.`,
            )
            if (ok) {
              setEditId(null)
              if (editing.id === meId) onSelfEdited()
            }
          }}
        />
      )}

      {target && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setDeleteId(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby={`${id}-del`}>
            <h2 id={`${id}-del`} className="hf-asite__confirm-title">
              ¿Quitar el acceso a <span className="hf-asite__gold">{target.name}?</span>
            </h2>
            <p className="hf-ausers__muted">{target.username} ya no podrá entrar al panel y se cierran sus sesiones.</p>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button
                type="button"
                className="hf-admin__btn hf-admin__btn--primary"
                disabled={busy}
                onClick={async () => {
                  await run(() => adminApi.deleteUser(target.id), `Acceso de ${target.username} quitado.`)
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

function MyPassword({ name, username, onError }: { name: string; username: string; onError: (e: unknown) => string }) {
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
      <p className="hf-ausers__muted">{name} · usuario {username}</p>
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

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** "3 de marzo" a partir de "YYYY-MM-DD" */
const birthdayLabel = (iso: string) => `${Number(iso.slice(8, 10))} de ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]}`

/** Fecha de nacimiento (día, mes y año): ese día la web festeja su cumpleaños con su nombre */
function BirthDateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId()
  const [max] = useState(() => new Date().toISOString().slice(0, 10))
  return (
    <label className="hf-admin__field" htmlFor={`${id}-birth`}>
      Fecha de nacimiento (opcional)
      <input id={`${id}-birth`} className="hf-admin__input hf-ausers__date" type="date" min="1900-01-01" max={max} value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="hf-ausers__match">{value ? `Su cumpleaños (${birthdayLabel(value)}) se festeja en la web con su nombre.` : 'Ese día la web festeja su cumpleaños con su nombre.'}</span>
    </label>
  )
}

/** Contraseña temporal con botón de copiar */
function TempPassword({ value, big = false }: { value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // sin portapapeles (http o permiso): se selecciona a mano
    }
  }
  return (
    <span className={`hf-ausers__temp ${big ? 'is-big' : ''}`}>
      {!big && <span className="hf-ausers__temp-label">Temporal</span>}
      <code>{value}</code>
      <button type="button" className="hf-ausers__copy" onClick={copy} aria-label={`Copiar la contraseña temporal ${value}`}>
        {copied ? 'Copiada' : 'Copiar'}
      </button>
    </span>
  )
}

/** Rol de un usuario: dos pills con su descripción debajo */
function RolePicker({ value, onChange }: { value: AdminRole; onChange: (r: AdminRole) => void }) {
  const id = useId()
  return (
    <div className="hf-admin__field">
      <span id={`${id}-label`}>Rol</span>
      <div className="hf-ausers__roles" role="radiogroup" aria-labelledby={`${id}-label`}>
        {(['ADMIN', 'STAFF'] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={value === r} className="hf-ausers__role" onClick={() => onChange(r)}>
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      <span className="hf-ausers__match">{ROLE_HINT[value]}.</span>
    </div>
  )
}

/** El usuario sin el número que se agrega cuando ya existía ("jnunez2" → "jnunez") */
const usernameBase = (username: string) => username.replace(/\d+$/, '')

/** Ventana para editar el nombre y el teléfono de un usuario; el usuario se puede volver a armar con el nombre nuevo */
function EditUser({ user, busy, onCancel, onSave }: { user: AdminUserRow; busy: boolean; onCancel: () => void; onSave: (p: AdminUserProfile & { regenerateUsername: boolean }) => void }) {
  const id = useId()
  const [f, setF] = useState<AdminUserProfile>({
    firstName: user.firstName,
    middleName: user.middleName ?? '',
    lastName: user.lastName,
    secondLastName: user.secondLastName ?? '',
    phone: user.phone ?? '',
    role: user.role,
    birthDate: user.birthDate ?? '',
  })
  const [regenerate, setRegenerate] = useState(false)
  const first = useRef<HTMLInputElement>(null)
  useEffect(() => first.current?.focus(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  // El usuario del principal no cambia (es ROOT_ADMIN_USERNAME); a los demás se les ofrece si el nombre ya no cuadra
  const proposed = staffUsername(f.firstName, f.lastName)
  const canRegenerate = !user.isRoot && !!proposed && proposed !== usernameBase(user.username)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v ?? '').trim()])) as unknown as AdminUserProfile
    onSave({ ...clean, birthDate: clean.birthDate || null, regenerateUsername: canRegenerate && regenerate })
  }

  return (
    <div className="hf-asite__modal">
      <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={onCancel} />
      <form className="hf-asite__confirm hf-ausers__edit" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={submit}>
        <h2 id={`${id}-title`} className="hf-asite__confirm-title">
          Editar a <span className="hf-asite__gold">{user.name}</span>
        </h2>
        <div className="hf-ausers__grid hf-ausers__grid--two">
          {(
            [
              ['firstName', 'Primer nombre', true],
              ['middleName', 'Segundo nombre (opcional)', false],
              ['lastName', 'Primer apellido', true],
              ['secondLastName', 'Segundo apellido (opcional)', false],
            ] as const
          ).map(([key, label, required], i) => (
            <label key={key} className="hf-admin__field" htmlFor={`${id}-${key}`}>
              {label}
              <input
                ref={i === 0 ? first : undefined}
                id={`${id}-${key}`}
                className="hf-admin__input"
                required={required}
                maxLength={60}
                autoComplete="off"
                value={f[key] ?? ''}
                onChange={(e) => setF({ ...f, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="hf-admin__field" htmlFor={`${id}-phone`}>
            Teléfono
            <input id={`${id}-phone`} className="hf-admin__input" type="tel" inputMode="tel" required pattern="[0-9+()\s\-]{8,20}" title="Al menos 8 dígitos" autoComplete="off" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </label>
          <div className="hf-admin__field">
            Usuario
            <output className="hf-ausers__email is-empty">{user.username}</output>
          </div>
          <BirthDateField value={f.birthDate ?? ''} onChange={(birthDate) => setF({ ...f, birthDate })} />
        </div>
        {user.isRoot ? (
          <p className="hf-ausers__muted">El usuario principal siempre es Admin, y su usuario no cambia: es el de ROOT_ADMIN_USERNAME en .env.</p>
        ) : (
          <RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} />
        )}
        {canRegenerate && (
          <label className="hf-ausers__check">
            <input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />
            <span>
              Cambiar su usuario a <span className="hf-asite__gold">{proposed}</span>
              <span className="hf-ausers__phone">Entrará con el usuario nuevo y se cerrarán sus sesiones. Si ya existe, se le agrega un número.</span>
            </span>
          </label>
        )}
        <div className="hf-asite__confirm-actions">
          <button type="button" className="hf-admin__btn" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="hf-admin__btn hf-admin__btn--primary" disabled={busy}>Guardar</button>
        </div>
      </form>
    </div>
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
  unknown: 'Usuario que no existe',
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
                    {e.user?.name ?? e.username}
                    {e.user && <span className="hf-ausers__phone">{e.username}</span>}
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
