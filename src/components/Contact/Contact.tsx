import { useId, useState, type FormEvent } from 'react'
import { socials, testimonial } from '../../data/site'
import { submitContact } from '../../lib/submit'
import { Button } from '../shared/Button'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
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
        <p className="hf-contact__status" role="status">
          {status === 'sent' && 'Recibido. Te escribimos pronto.'}
          {status === 'error' && 'No pudimos enviar tu correo. Intenta de nuevo.'}
        </p>
      </form>

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
