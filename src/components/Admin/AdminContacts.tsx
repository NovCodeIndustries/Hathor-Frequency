import { useCallback, useEffect, useState } from 'react'
import { contactTopics } from '../../data/site'
import { adminApi, formatStamp, type AdminContact } from '../../lib/adminApi'
import { useAdmin } from '../../lib/useAdmin'
import './AdminContacts.css'
import { useAdminLive } from '../../lib/useAdminLive'

/** Minúsculas y sin acentos, para buscar "maria" y encontrar "María" */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Contactos (diseño C1): quién pidió información, sobre qué tema y si ya se atendió; con buscador */
export function AdminContacts() {
  const { refreshSummary, onError } = useAdmin()
  const [contacts, setContacts] = useState<AdminContact[] | null>(null)
  const [topic, setTopic] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminApi.contacts().then(setContacts).catch((err) => setError(onError(err)))
  }, [onError])
  useEffect(load, [load])
  useAdminLive(['contact'], load)

  const toggle = async (c: AdminContact) => {
    try {
      const updated = await adminApi.setContactHandled(c.id, !c.handledAt)
      setContacts((list) => list?.map((x) => (x.id === c.id ? updated : x)) ?? null)
      setError('')
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    }
  }

  const needle = fold(query.trim())
  const digits = query.replace(/\D/g, '')
  const shown = (contacts ?? []).filter((c) => (!topic || c.topic === topic) && (!needle || (fold(`${c.name} ${c.email} ${c.topic}`).includes(needle) || (digits.length >= 3 && !!c.phone?.replace(/\D/g, '').includes(digits)))))

  return (
    <>
      <title>Contactos · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">Contactos</h1>
          <p className="hf-admin__lead">Personas que pidieron información desde Contacto.</p>
        </div>
        <div className="hf-acontacts__filters">
        <div className="hf-admin__field">
          Buscar
          <div className="hf-admin__search hf-acontacts__search" role="search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="m11 11 3.5 3.5" /></svg>
            <input
              type="search"
              className="hf-admin__search-input"
              aria-label="Buscar contactos por nombre, correo o teléfono"
              placeholder="Nombre, correo o teléfono"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
            />
            {query && (
              <button type="button" className="hf-admin__search-clear" aria-label="Borrar búsqueda" onClick={() => setQuery('')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            )}
          </div>
        </div>
        <label className="hf-admin__field">
          Tema
          <select className="hf-admin__input" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Todos los temas</option>
            {contactTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        </div>
      </div>

      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-acontacts" aria-busy={contacts === null}>
        <table className="hf-acontacts__table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Tema</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Correo</th>
              <th scope="col">Recibido</th>
              <th scope="col">Atendido</th>
              <th scope="col" className="hf-acontacts__right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id} className={c.handledAt ? 'is-done' : ''}>
                <td>{c.name}</td>
                <td data-label="Tema"><span className="hf-chip hf-chip--tag">{c.topic}</span></td>
                <td data-label="Teléfono">
                  {c.phone ? <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a> : <span className="hf-acontacts__muted">Sin teléfono</span>}
                </td>
                <td data-label="Correo"><a href={`mailto:${c.email}`}>{c.email}</a></td>
                <td data-label="Recibido" className="hf-acontacts__muted">{formatStamp(c.createdAt)}</td>
                <td data-label="Atendido">
                  <label className="hf-acontacts__check">
                    <input type="checkbox" checked={!!c.handledAt} onChange={() => toggle(c)} />
                    {c.handledAt ? 'Sí' : 'No'}
                    <span className="sr-only">, atendido: {c.name}</span>
                  </label>
                </td>
                <td className="hf-acontacts__right">
                  <a
                    className="hf-acontacts__reply"
                    href={`mailto:${c.email}?subject=${encodeURIComponent(`Hathor Frequency · ${c.topic}`)}`}
                  >
                    Responder
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts && shown.length === 0 && (
          <p className="hf-admin__empty">{query.trim() ? `Ningún contacto coincide con “${query.trim()}”.` : 'No hay contactos aquí.'}</p>
        )}
      </div>
    </>
  )
}
