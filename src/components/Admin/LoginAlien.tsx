import './LoginAlien.css'

export type AlienMood = 'listen' | 'email' | 'pass' | 'error' | 'ok' | 'party'

const LABEL: Record<AlienMood, string> = {
  listen: 'Alien con audífonos escuchando música',
  email: 'El alien mira el campo de usuario',
  pass: 'El alien se tapa los ojos mientras escribes la contraseña',
  error: 'El alien se asusta: se le cae un audífono',
  ok: 'El alien brinca de gusto',
  party: 'El alien, con gorro de fiesta, te canta las mañanitas',
}

const NOTE_EIGHTH = 'M8 0v14a4 4 0 1 1-2-3.4V0z'
const NOTE_PAIR = 'M12 0v15a4 4 0 1 1-2-3.4V4L5 5.2V18a4 4 0 1 1-2-3.4V2z'

function Hand({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 44 22" aria-hidden="true" focusable="false">
      <circle cx="9" cy="12" r="6.5" />
      <circle cx="22" cy="10" r="7" />
      <circle cx="35" cy="12" r="6.5" />
    </svg>
  )
}

/**
 * Alien del login (A4 escritorio · M1 móvil): se asoma tras el borde superior de la tarjeta
 * con audífonos y reacciona al formulario. La cabeza va detrás de la tarjeta y las manos delante.
 */
export function LoginAlien({ mood }: { mood: AlienMood }) {
  const notes = mood === 'listen' || mood === 'ok' || mood === 'party'
  return (
    <>
      <div className="hf-lalien" data-mood={mood}>
        <svg className="hf-lalien__svg" viewBox="-15 -12 150 114" role="img" aria-label={LABEL[mood]}>
          <g className="hf-lalien__head">
            {/* Cumpleaños (B3): gorro de fiesta */}
            {mood === 'party' && (
              <g className="hf-lalien__hat">
                <path d="M44 -2 L60 -54 L76 -2Z" fill="#E8577D" stroke="#F2C94C" strokeWidth="1.6" />
                <path d="M49 -16 L71 -20 M46 -6 L74 -10" stroke="#F2C94C" strokeWidth="2" />
                <circle cx="60" cy="-56" r="5" fill="#F2C94C" />
              </g>
            )}
            <path className="hf-lalien__skin" d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" />

            {mood === 'listen' && (
              <>
                <path className="hf-lalien__eye" d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z" />
                <path className="hf-lalien__eye" d="M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" />
                <circle className="hf-lalien__glint" cx="40" cy="46" r="2.3" />
                <circle className="hf-lalien__glint" cx="80" cy="46" r="2.3" />
              </>
            )}
            {mood === 'email' && (
              <>
                <path className="hf-lalien__eye" d="M30 52 C36 42 54 44 56 58 C48 65 34 64 30 52Z" />
                <path className="hf-lalien__eye" d="M90 52 C84 42 66 44 64 58 C72 65 86 64 90 52Z" />
                <circle className="hf-lalien__glint" cx="46" cy="57" r="2.3" />
                <circle className="hf-lalien__glint" cx="74" cy="57" r="2.3" />
              </>
            )}
            {mood === 'pass' && <path className="hf-lalien__line" d="M32 52 L54 55 M88 52 L66 55" />}
            {mood === 'error' && (
              <>
                <circle className="hf-lalien__eye" cx="42" cy="50" r="11" />
                <circle className="hf-lalien__eye" cx="78" cy="50" r="11" />
                <circle className="hf-lalien__glint hf-lalien__glint--wide" cx="42" cy="50" r="2.6" />
                <circle className="hf-lalien__glint hf-lalien__glint--wide" cx="78" cy="50" r="2.6" />
              </>
            )}
            {(mood === 'ok' || mood === 'party') && (
              <path className="hf-lalien__line" d="M31 52 C37 44 49 44 54 52 M89 52 C83 44 71 44 66 52" />
            )}

            <path className="hf-lalien__band" d="M14 52 C12 -12 108 -12 106 52" />
            <g transform={mood === 'error' ? 'translate(-8 18) rotate(-28 16 53)' : undefined}>
              <rect className="hf-lalien__shell" x="6" y="36" width="20" height="34" rx="9" />
              <rect className="hf-lalien__pad" x="11" y="43" width="10" height="20" rx="4" />
            </g>
            <rect className="hf-lalien__shell" x="94" y="36" width="20" height="34" rx="9" />
            <rect className="hf-lalien__pad" x="99" y="43" width="10" height="20" rx="4" />
            {mood === 'error' && <text className="hf-lalien__huh" x="112" y="10">?</text>}
            {/* Cumpleaños (B3): espantasuegras que se estira */}
            {mood === 'party' && (
              <g className="hf-lalien__horn">
                <path d="M66 74 L118 66 L120 82 L66 80Z" fill="#3FA9F5" stroke="#F2C94C" strokeWidth="1.4" />
                <path d="M84 72 L84 79 M100 70 L100 80" stroke="#F2C94C" strokeWidth="1.4" />
              </g>
            )}
          </g>
        </svg>

        {notes && (
          <>
            <svg className="hf-lalien__note hf-lalien__note--a" viewBox="0 0 16 22" aria-hidden="true" focusable="false">
              <path d={NOTE_PAIR} />
            </svg>
            <svg className="hf-lalien__note hf-lalien__note--b" viewBox="0 0 12 20" aria-hidden="true" focusable="false">
              <path d={NOTE_EIGHTH} />
            </svg>
          </>
        )}
      </div>

      <div className="hf-lalien-hands" data-mood={mood} aria-hidden="true">
        <Hand className="hf-lalien-hands__hand hf-lalien-hands__hand--left" />
        <Hand className="hf-lalien-hands__hand hf-lalien-hands__hand--right" />
      </div>
    </>
  )
}
