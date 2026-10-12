import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PARTY_COLORS } from '../../lib/birthdayParty'
import './BirthdayParty.css'

const CONFETTI = Array.from({ length: 42 }, (_, i) => ({
  left: `${(i * 61) % 100}%`,
  background: PARTY_COLORS[i % PARTY_COLORS.length],
  animationDelay: `${((i * 0.17) % 2.4).toFixed(2)}s`,
}))

/**
 * Paso 2 del cumpleaños (B1): pantalla completa con el pastel y tres velas. "Soplar las velas" las apaga,
 * cae confeti y aparece "Entrar al panel". "Saltar" o Esc terminan todo el recorrido.
 */
export function BirthdayCake({ name, onDone, onSkip }: { name: string; onDone: () => void; onSkip: () => void }) {
  const [blown, setBlown] = useState(false)
  const main = useRef<HTMLButtonElement>(null)

  useEffect(() => main.current?.focus(), [blown])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onSkip])

  return createPortal(
    <div className="hf-bcake" role="dialog" aria-modal="true" aria-labelledby="bcake-title">
      {blown && (
        <div className="hf-bparty__confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <span key={i} className="hf-bparty__bit" style={c} />
          ))}
        </div>
      )}
      <button type="button" className="hf-bcake__skip" onClick={onSkip}>Saltar</button>

      <div className="hf-bcake__body">
        <span className="hf-bcake__kick">Hoy es tu día</span>
        <h1 id="bcake-title" className="hf-bcake__title">
          ¡Feliz cumpleaños, <span>{name}!</span>
        </h1>

        <svg className="hf-bcake__cake" viewBox="0 0 300 250" role="img" aria-label={blown ? 'Pastel con las velas apagadas' : 'Pastel con tres velas encendidas'}>
          <ellipse cx="150" cy="236" rx="130" ry="10" fill="#F2C94C" fillOpacity=".12" />
          <rect x="40" y="150" width="220" height="80" rx="10" fill="#141210" stroke="#B8860B" strokeWidth="2" />
          <path d="M40 172 C70 190 90 160 120 178 C150 196 170 162 200 180 C226 194 244 168 260 176" fill="none" stroke="#F2C94C" strokeWidth="3" strokeLinecap="round" />
          <rect x="70" y="96" width="160" height="58" rx="10" fill="#1d1a14" stroke="#B8860B" strokeWidth="2" />
          <path d="M70 114 C92 128 108 104 130 118 C152 132 168 106 190 120 C208 130 222 112 230 116" fill="none" stroke="#E8577D" strokeWidth="3" strokeLinecap="round" />
          <circle cx="104" cy="200" r="4" fill="#3FA9F5" />
          <circle cx="150" cy="208" r="4" fill="#E8577D" />
          <circle cx="196" cy="200" r="4" fill="#7bb342" />
          <rect x="104" y="60" width="10" height="38" rx="3" fill="#E8577D" />
          <rect x="145" y="54" width="10" height="44" rx="3" fill="#3FA9F5" />
          <rect x="186" y="60" width="10" height="38" rx="3" fill="#F2C94C" />
          {[
            [109, 48],
            [150, 42],
            [191, 48],
          ].map(([x, y], i) =>
            blown ? (
              <circle key={x} className="hf-bcake__smoke" cx={x} cy={y + 2} r="6" fill="#bbb" fillOpacity=".5" style={{ animationDelay: `${i * 0.3}s` }} />
            ) : (
              <g key={x}>
                <circle className="hf-bcake__glow" cx={x} cy={y} r="16" fill="#F2C94C" fillOpacity=".25" />
                <path className="hf-bcake__flame" d={`M${x} ${y - 12} C${x + 7} ${y - 2} ${x + 5} ${y + 8} ${x} ${y + 10} C${x - 5} ${y + 8} ${x - 7} ${y - 2} ${x} ${y - 12}Z`} fill="#F2C94C" />
              </g>
            ),
          )}
        </svg>

        {blown ? (
          <>
            <p className="hf-bcake__text hf-bparty__in">
              Que se cumpla. <em>Todo el estudio te manda un abrazo.</em>
            </p>
            <button ref={main} type="button" className="hf-bparty__btn hf-bparty__in" onClick={onDone}>Entrar al panel</button>
          </>
        ) : (
          <>
            <p className="hf-bcake__text">Pide un deseo y sopla las velas.</p>
            <button ref={main} type="button" className="hf-bparty__btn" onClick={() => setBlown(true)}>Soplar las velas</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
