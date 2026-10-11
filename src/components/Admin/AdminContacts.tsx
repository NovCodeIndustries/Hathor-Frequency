import { useEffect, useState } from 'react'
import { contactTopics } from '../../data/site'
import { adminApi, formatStamp, type AdminContact } from '../../lib/adminApi'
import { useAdmin } from '../../lib/useAdmin'
import './AdminContacts.css'

/** Contactos (diseño C1): quién pidió información, sobre qué tema y si ya se atendió */
export function AdminContacts() {
  const { refreshSummary, onError } = useAdmin()
  const [contacts, setContacts] = useState<AdminContact[] | null>(null)
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.contacts().then(setContacts).catch((err) => setError(onError(err)))
  }, [onError])

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

  const shown = (contacts ?? []).filter((c) => !topic || c.topic === topic)

  return (
    <>
      <title>Contactos · Panel</title>
      <div className="hf-admin__head">
        <div>
          <h1 className="hf-admin__title">Contactos</h1>
          <p className="hf-admin__lead">Personas que pidieron información desde Contacto.</p>
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

      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-acontacts" aria-busy={contacts === null}>
        <table className="hf-acontacts__table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Tema</th>
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
                <td><span className="hf-chip hf-chip--tag">{c.topic}</span></td>
                <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                <td className="hf-acontacts__muted">{formatStamp(c.createdAt)}</td>
                <td>
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
        {contacts && shown.length === 0 && <p className="hf-admin__empty">No hay contactos aquí.</p>}
      </div>
    </>
  )
}
