import { useCallback, useId, useRef, useState, type FormEvent } from 'react'
import { PageLink } from '../shared/PageLink'
import { contactTopics } from '../../data/site'
import { useContent } from '../../lib/content'
import { submitContact, submitErrorText } from '../../lib/submit'
import { useSeason } from '../../lib/useSeason'
import { ReviewsRotator } from '../Reviews/ReviewsRotator'
import { Button } from '../shared/Button'
import { Honeypot } from '../shared/Honeypot'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { WhatsAppIcon } from '../shared/SocialIcon'
import { VinylRings } from '../shared/VinylRings'
import './Contact.css'
import { Module } from '../shared/Module'
import { ContactModal } from './ContactModal'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const ARC = 'M 550 10 A 540 540 0 0 1 1010 270'

export function Contact() {
  const { socials, whatsapp } = useContent('sitio')
  const season = useSeason()
  const nameId = useId()
  const topicId = useId()
  const emailId = useId()
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const trap = useRef<HTMLInputElement>(null)
  // Copia de lo enviado para el modal de confirmación (solo informativo)
  const [sent, setSent] = useState<{ name: string; topic: string; email: string } | null>(null)
  const closeSent = useCallback(() => setSent(null), [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await submitContact({ name: name.trim(), topic, email: email.trim(), website: trap.current?.value })
      setSent({ name: name.trim(), topic, email: email.trim() })
      setStatus('sent')
      setName('')
      setTopic('')
      setEmail('')
    } catch (err) {
      setError(submitErrorText(err, 'No pudimos enviar tus datos. Intenta de nuevo.'))
      setStatus('error')
    }
  }

  return (
    <section id="contacto" className="hf-contact" aria-labelledby="contacto-title">
      <VinylRings
        className="hf-contact__rings hf-contact__rings--desktop"
        size={1100}
        radii={[540, 500, 460, 420, 380, 340]}
        strokeOpacity={0.12}
        extra={{ r: 300, opacity: 0.35 }}
        arc={{ d: ARC, opacity: 0.6 }}
      />
      <VinylRings
        className="hf-contact__rings hf-contact__rings--mobile"
        size={1100}
        radii={[540, 480, 420, 360]}
        strokeOpacity={0.14}
        extra={{ r: 300, opacity: 0.35 }}
        arc={{ d: ARC, opacity: 0.6, width: 3 }}
      />

      <Eyebrow both>Contacto</Eyebrow>
      <h1 id="contacto-title" className="hf-contact__title">
        ¿Tienes una canción <GoldText strong>esperando salir?</GoldText>
      </h1>
      <p className="hf-lead">Escríbenos y la ponemos a girar.</p>

      {/* Aviso: este formulario es para pedir información (Reservar es para apartar fecha) */}
      <div className="hf-contact__info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
        <p>
          Este formulario es para <strong>pedir información</strong>. Déjanos tu correo y un asesor se pondrá en
          contacto contigo.
        </p>
      </div>

      <form className="hf-contact__form" onSubmit={handleSubmit}>
        <Honeypot ref={trap} />
        <label htmlFor={nameId} className="sr-only">Tu nombre</label>
        <div className="hf-contact__pill hf-contact__pill--name">
          <input
            id={nameId}
            className="hf-contact__input"
            type="text"
            name="name"
            placeholder="Tu nombre"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (status !== 'sending') setStatus('idle')
            }}
          />
        </div>
        <label htmlFor={topicId} className="sr-only">¿Sobre qué quieres información?</label>
        <div className="hf-contact__pill hf-contact__pill--name hf-contact__pill--select">
          <select
            id={topicId}
            className={`hf-contact__input hf-contact__select ${topic ? '' : 'is-empty'}`}
            name="topic"
            required
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              if (status !== 'sending') setStatus('idle')
            }}
          >
            <option value="" disabled>
              ¿Sobre qué quieres información?
            </option>
            {contactTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <svg className="hf-contact__chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6l5 5 5-5" />
          </svg>
        </div>
        <label htmlFor={emailId} className="sr-only">Tu correo</label>
        <div className="hf-contact__pill">
          <input
            id={emailId}
            className="hf-contact__input"
            type="email"
            name="email"
            placeholder={season?.page.placeholder ?? 'Tu correo'}
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status !== 'sending') setStatus('idle')
            }}
          />
          <Button type="submit" variant="primary" className="hf-contact__submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Enviando…' : 'Contactar'}
          </Button>
        </div>
        <PageLink to="/reservar" className="hf-contact__book">
          ¿Ya quieres apartar fecha? <span>Reserva aquí →</span>
        </PageLink>
        <p className="hf-contact__status" role="status">
          {status === 'sent' && 'Recibido. Te escribimos pronto.'}
          {status === 'error' && error}
        </p>
      </form>

      <Module id="global.socials">
      {/* WhatsApp: ícono + número (link a wa.me cuando haya número) */}
      {whatsapp.number ? (
        <a
          className="hf-contact__wa"
          href={`https://wa.me/${whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Escríbenos por WhatsApp al ${whatsapp.display}`}
        >
          <WhatsAppIcon />
          <span className="hf-contact__wa-label">WhatsApp</span>
          <span className="hf-contact__wa-number">{whatsapp.display}</span>
        </a>
      ) : (
        <p className="hf-contact__wa">
          <WhatsAppIcon />
          <span className="hf-contact__wa-label">WhatsApp</span>
          <span className="hf-contact__wa-number">{whatsapp.display}</span>
        </p>
      )}
      </Module>

      {/* Opiniones que van cambiando (antes, un testimonio fijo) */}
      <Module id="contacto.opiniones">
        <ReviewsRotator />
      </Module>

      <Module id="global.socials">
        <nav className="hf-contact__social" aria-label="Redes">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
          ))}
        </nav>
      </Module>
      {sent && <ContactModal {...sent} onClose={closeSent} />}
    </section>
  )
}
