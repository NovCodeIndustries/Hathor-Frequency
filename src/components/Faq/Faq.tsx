import { useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { faqs } from '../../data/faq'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import './Faq.css'

const pad = (n: number) => String(n).padStart(2, '0')

/** Grooves del disco */
const GROOVES = [250, 222, 194, 166, 138]

/**
 * Preguntas frecuentes, estilo Q3 · Vinilo: lista a la izquierda y la respuesta
 * en un panel sobre el disco, que gira al cambiar de pregunta.
 */
export function Faq() {
  const [current, setCurrent] = useState(0)
  const answerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const pick = (index: number) => {
    setCurrent(index)
    // En móvil la respuesta queda arriba de la lista: la llevamos a la vista
    if (isMobile) answerRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const faq = faqs[current]

  return (
    <section className="hf-faq hf-container" aria-labelledby="faq-title">
      <div className="hf-faq__head">
        <Eyebrow both>Preguntas frecuentes</Eyebrow>
        <h1 id="faq-title" className="hf-h2">
          Pon la aguja <GoldText>en tu duda.</GoldText>
        </h1>
      </div>

      <div className="hf-faq__body">
        <ol className="hf-faq__list" aria-label="Preguntas">
          {faqs.map((f, i) => (
            <li key={f.q}>
              <button
                type="button"
                className="hf-faq__q"
                aria-pressed={i === current}
                aria-controls="hf-faq-answer"
                onClick={() => pick(i)}
              >
                <span className="hf-faq__n">{pad(i + 1)}</span>
                <span>{f.q}</span>
                <span className="hf-faq__arrow" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="hf-faq__player">
          <div className="hf-faq__deck" aria-hidden="true">
            {/* Rota un <g> interno: rotar el <svg> agranda su caja y genera scroll horizontal */}
            <svg className="hf-faq__disc" viewBox="0 0 560 560" fill="none">
              <g className="hf-faq__spin" style={{ '--rot': `${current * 72}deg` } as CSSProperties}>
              <circle cx="280" cy="280" r="278" fill="#0a0a0a" stroke="#333" />
              {GROOVES.map((r) => (
                <circle key={r} cx="280" cy="280" r={r} stroke="#F2C94C" strokeOpacity="0.25" />
              ))}
              <path d="M280 40a240 240 0 0 1 200 108" stroke="#F2C94C" strokeOpacity="0.7" strokeWidth="2" />
              <circle cx="280" cy="280" r="100" fill="#F2C94C" />
              </g>
            </svg>
            <div className="hf-faq__label">
              <span>Pregunta</span>
              <strong>{pad(current + 1)}</strong>
              <span>de {pad(faqs.length)}</span>
            </div>
            <svg className="hf-faq__arm" viewBox="0 0 190 300" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round">
              <circle cx="150" cy="40" r="22" fill="#111" stroke="#444" strokeWidth="1.5" />
              <path d="M150 40L120 230L82 268" />
              <rect x="66" y="258" width="30" height="16" rx="3" fill="#F2C94C" stroke="none" transform="rotate(42 81 266)" />
            </svg>
          </div>

          <div ref={answerRef} id="hf-faq-answer" className="hf-faq__answer" aria-live="polite">
            <span className="hf-faq__track">Track {pad(current + 1)}</span>
            <h2 className="hf-faq__question">{faq.q}</h2>
            <p className="hf-faq__text">{faq.a}</p>
            <div className="hf-faq__foot">
              <Link to="/contacto" className="hf-faq__contact">
                ¿Otra duda? <span>Escríbenos →</span>
              </Link>
              <button type="button" className="hf-faq__next" onClick={() => setCurrent((current + 1) % faqs.length)}>
                Siguiente pregunta →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
