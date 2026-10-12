import { useEffect, useState } from 'react'
import { PARTY_COLORS } from '../../lib/birthdayParty'
import './BirthdayParty.css'

const MESSAGES = ['Un año más de buena música', 'Hoy no hay sesión que falle', 'Que suene fuerte', 'Lado A: tu mejor año', 'Pastel en el estudio', '¡Que lo cumplas feliz!']
const SPOTS = [
  { left: '6%', top: 80 },
  { left: '20%', top: 30 },
  { left: '36%', top: 110 },
  { left: '54%', top: 20 },
  { left: '70%', top: 90 },
  { left: '86%', top: 50 },
]

/**
 * Paso 3 del cumpleaños (B4): ya dentro del panel, suben seis globos desde abajo con un aviso dorado arriba.
 * Cada globo se revienta con un clic y suelta un mensaje; al reventarlos todos (o con "Cerrar") termina.
 */
export function BirthdayBalloons({ name, onDone }: { name: string; onDone: () => void }) {
  const [popped, setPopped] = useState<number[]>([])
  const left = SPOTS.length - popped.length

  // Todos reventados: el aviso se despide y se va solo
  useEffect(() => {
    if (left) return
    const t = window.setTimeout(onDone, 3500)
    return () => window.clearTimeout(t)
  }, [left, onDone])

  return (
    <>
      <div className="hf-bballoons__banner" role="status">
        <span className="hf-bballoons__msg">
          {left ? (
            <>
              ¡Feliz cumpleaños, <span>{name}!</span> Revienta tus globos.
            </>
          ) : (
            <>
              ¡Listo, <span>{name}!</span> Que tengas un gran día.
            </>
          )}
        </span>
        <span className="hf-bballoons__actions">
          <span className="hf-bballoons__count">{left ? `${popped.length} de ${SPOTS.length}` : 'Todos reventados'}</span>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={onDone}>Cerrar</button>
        </span>
      </div>

      <div className="hf-bballoons" aria-hidden={left === 0}>
        {SPOTS.map((spot, i) => {
          const color = PARTY_COLORS[i % PARTY_COLORS.length]
          const done = popped.includes(i)
          return (
            <div key={i} className="hf-bballoons__slot" style={{ left: spot.left, top: spot.top, animationDelay: `${i * 0.15}s` }}>
              {done ? (
                <div className="hf-bballoons__popped">
                  <svg className="hf-bballoons__burst" width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
                    <path d="M45 5 L45 25 M45 65 L45 85 M5 45 L25 45 M65 45 L85 45 M17 17 L31 31 M59 59 L73 73 M73 17 L59 31 M31 59 L17 73" stroke={color} strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="hf-bballoons__note">{MESSAGES[i]}</span>
                </div>
              ) : (
                <div className="hf-bballoons__float" style={{ animationDelay: `${-i * 0.5}s` }}>
                  <button type="button" className="hf-bballoons__balloon" aria-label={`Reventar el globo ${i + 1}`} onClick={() => setPopped((p) => [...p, i])}>
                    <svg width="70" height="130" viewBox="0 0 70 130" aria-hidden="true">
                      <ellipse cx="35" cy="36" rx="31" ry="35" fill={color} />
                      <ellipse cx="24" cy="22" rx="7" ry="11" fill="#fff" fillOpacity=".25" />
                      <path d="M31 70 L39 70 L35 76Z" fill={color} />
                      <path d="M35 76 C29 92 41 106 35 128" stroke="#bbb" fill="none" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
