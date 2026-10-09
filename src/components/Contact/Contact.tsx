import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { socials, testimonial, whatsapp } from '../../data/site'
import { submitContact } from '../../lib/submit'
import { Button } from '../shared/Button'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { WhatsAppIcon } from '../shared/SocialIcon'
import { VinylRings } from '../shared/VinylRings'
import './Contact.css'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const ARC = 'M 550 10 A 540 540 0 0 1 1010 270'

export function Contact() {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await submitContact(email)
      setStatus('sent')
      setEmail('')
    } catch {
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
        <label htmlFor={emailId} className="sr-only">Tu correo</label>
        <div className="hf-contact__pill">
          <input
            id={emailId}
            className="hf-contact__input"
            type="email"
            name="email"
            placeholder="Tu correo"
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
        <Link to="/reservar" className="hf-contact__book">
          ¿Ya quieres apartar fecha? <span>Reserva aquí →</span>
        </Link>
        <p className="hf-contact__status" role="status">
          {status === 'sent' && 'Recibido. Te escribimos pronto.'}
          {status === 'error' && 'No pudimos enviar tu correo. Intenta de nuevo.'}
        </p>
      </form>

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

      <figure className="hf-contact__quote">
        <blockquote>{testimonial.quote}</blockquote>
        <figcaption>{testimonial.author}</figcaption>
      </figure>

      <nav className="hf-contact__social" aria-label="Redes">
        {socials.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
        ))}
      </nav>
    </section>
  )
}
