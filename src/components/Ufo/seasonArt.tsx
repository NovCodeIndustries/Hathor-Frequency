import type { CSSProperties } from 'react'
import type { GlyphName, SeasonId } from '../../data/seasons'

/** Glifos de temporada (SVG decorativos) */
export function Glyph({ name, size = 24, color, className, style }: { name: GlyphName; size?: number; color?: string; className?: string; style?: CSSProperties }) {
  const common = { className, style, 'aria-hidden': true as const, focusable: false as const }
  switch (name) {
    case 'heart':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 21 C5 15 2 12 2 8 C2 5 4.5 3 7 3 C9 3 11 4.5 12 6 C13 4.5 15 3 17 3 C19.5 3 22 5 22 8 C22 12 19 15 12 21Z" fill={color ?? '#E8577D'} />
        </svg>
      )
    case 'pumpkin':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 28 28">
          <path d="M14 7 C14 4 16 3 17 3" stroke="#3d7a2a" strokeWidth="2" fill="none" />
          <ellipse cx="14" cy="16" rx="12" ry="10" fill="#F28C28" />
          <path d="M14 6 C10 10 10 22 14 26 M14 6 C18 10 18 22 14 26" stroke="#c46a12" fill="none" />
          <path d="M8 13 L11 15 L8 16Z M20 13 L17 15 L20 16Z" fill="#000" />
          <path d="M8 19 Q14 24 20 19 L18 20 L16 19 L14 21 L12 19 L10 20Z" fill="#000" />
        </svg>
      )
    case 'bat':
      return (
        <svg {...common} width={size} height={size * 0.55} viewBox="0 0 40 22">
          <path d="M20 8 C18 4 17 3 16 6 C13 2 7 2 2 6 C6 7 8 10 8 14 C11 11 15 12 17 15 C18 12 19 11 20 12 C21 11 22 12 23 15 C25 12 29 11 32 14 C32 10 34 7 38 6 C33 2 27 2 24 6 C23 3 22 4 20 8Z" fill={color ?? '#7B3FA0'} />
        </svg>
      )
    case 'flower':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 22 22">
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
            <ellipse key={a} cx="11" cy="5" rx="3.2" ry="5" fill={color ?? '#F7A21B'} transform={`rotate(${a} 11 11)`} />
          ))}
          <circle cx="11" cy="11" r="3.5" fill="#c46a12" />
        </svg>
      )
    case 'skull':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 26 26">
          <path d="M13 2 C20 2 24 7 24 12 C24 16 21 18 20 19 L20 23 L6 23 L6 19 C5 18 2 16 2 12 C2 7 6 2 13 2Z" fill="#f1e6c8" />
          <circle cx="9" cy="12" r="3.4" fill="#000" />
          <circle cx="17" cy="12" r="3.4" fill="#000" />
          <circle cx="9" cy="12" r="1.3" fill="#E4007C" />
          <circle cx="17" cy="12" r="1.3" fill="#E4007C" />
          <path d="M13 15 L11.5 18 L14.5 18Z" fill="#000" />
          <path d="M9 21 V23 M12 21 V23 M15 21 V23 M18 21 V23" stroke="#000" />
        </svg>
      )
    case 'snow':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 14 14">
          <path d="M7 0 V14 M0 7 H14 M2 2 L12 12 M12 2 L2 12" stroke={color ?? '#fff'} strokeWidth="1.2" />
        </svg>
      )
    case 'gift':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 30 30">
          <rect x="3" y="11" width="24" height="17" fill="#C8102E" />
          <rect x="1" y="7" width="28" height="6" fill="#a50d26" />
          <rect x="13" y="7" width="4" height="21" fill="#F2C94C" />
          <path d="M15 7 C10 1 5 4 9 7 M15 7 C20 1 25 4 21 7" stroke="#F2C94C" strokeWidth="2" fill="none" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 1 L15 9 L23 9 L17 14 L19 22 L12 17 L5 22 L7 14 L1 9 L9 9Z" fill={color ?? '#F2C94C'} />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2 C7 2 6 7 6 11 C6 15 4 17 3 18 H21 C20 17 18 15 18 11 C18 7 17 2 12 2Z" fill="#F2C94C" />
          <circle cx="12" cy="20.5" r="2" fill="#B8860B" />
        </svg>
      )
    case 'candle':
      return (
        <svg {...common} width={size} height={size * 1.6} viewBox="0 0 18 29">
          <path className="hf-ufo__flame-sm" d="M9 1 C12 5 12 8 9 10 C6 8 6 5 9 1Z" fill="#F7A21B" />
          <rect x="4" y="11" width="10" height="17" rx="1" fill="#6B2D8C" />
          <rect x="4" y="15" width="10" height="2" fill="#E4007C" />
        </svg>
      )
    case 'bread':
      return (
        <svg {...common} width={size} height={size * 0.7} viewBox="0 0 30 21">
          <ellipse cx="15" cy="14" rx="14" ry="7" fill="#c98a3c" />
          <path d="M5 12 Q15 2 25 12 M8 15 Q15 7 22 15" stroke="#9c6526" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="15" cy="7" r="2.6" fill="#9c6526" />
        </svg>
      )
    case 'envelope':
      return (
        <svg {...common} width={size} height={size * 0.7} viewBox="0 0 34 24">
          <rect x="1" y="1" width="32" height="22" rx="2" fill="#f1e6c8" />
          <path d="M1 2 L17 14 L33 2" stroke="#b9a77a" fill="none" />
          <path d="M17 17 C14 14.5 13 13.5 13 12 C13 10.8 14 10 15 10 C16 10 16.6 10.6 17 11.2 C17.4 10.6 18 10 19 10 C20 10 21 10.8 21 12 C21 13.5 20 14.5 17 17Z" fill="#E8577D" />
        </svg>
      )
    case 'balloon':
      return (
        <svg {...common} width={size} height={size * 1.8} viewBox="0 0 22 40">
          <ellipse cx="11" cy="10" rx="9" ry="10" fill={color ?? '#3FA9F5'} />
          <path d="M9 20 L13 20 L11 23Z" fill={color ?? '#3FA9F5'} />
          <path d="M11 23 C8 28 14 32 11 40" stroke="#bbb" fill="none" />
          <ellipse cx="8" cy="6" rx="2" ry="3" fill="#fff" fillOpacity=".5" />
        </svg>
      )
    case 'plane':
      return (
        <svg {...common} width={size} height={size * 0.6} viewBox="0 0 34 20">
          <path d="M1 10 L33 1 L20 19 L15 12Z" fill="#f4f4f4" />
          <path d="M15 12 L33 1 L12 14Z" fill="#cfcfcf" />
        </svg>
      )
    case 'rose':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 22 22">
          <circle cx="11" cy="9" r="7.5" fill={color ?? '#E8577D'} />
          <path d="M11 4 C7 5 6 10 9 12 C12 13 15 10 13 7 C12 6 10 7 11 9" stroke="#7a1f3d" strokeWidth="1.2" fill="none" />
          <path d="M11 16 V22 M11 19 L7 17" stroke="#3d7a2a" strokeWidth="1.6" />
        </svg>
      )
    case 'glass':
      return (
        <svg {...common} width={size} height={size * 1.4} viewBox="0 0 22 31">
          <path d="M4 1 H18 L16 13 C15 17 7 17 6 13Z" fill="#F2C94C" fillOpacity=".85" stroke="#fff3c4" />
          <path d="M11 16 V28 M6 29 H16" stroke="#fff3c4" strokeWidth="1.5" />
          <circle cx="9" cy="7" r="1" fill="#fff" />
          <circle cx="13" cy="10" r=".8" fill="#fff" />
        </svg>
      )
    case 'grapes':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 26 24">
          <path d="M13 4 V0" stroke="#4e7a25" strokeWidth="1.5" />
          {[[7, 7], [13, 7], [19, 7], [10, 12], [16, 12], [13, 17], [7, 12], [19, 12]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill="#7bb342" stroke="#4e7a25" strokeWidth=".6" />
          ))}
        </svg>
      )
    case 'wreath':
      return (
        <svg {...common} width={size} height={size} viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="20" fill="none" stroke="#1F7A3A" strokeWidth="9" />
          <path d="M28 40 L20 52 M28 40 L36 52" stroke="#C8102E" strokeWidth="3" />
          <circle cx="28" cy="40" r="4" fill="#C8102E" />
          <circle cx="14" cy="22" r="2.5" fill="#C8102E" />
          <circle cx="42" cy="22" r="2.5" fill="#F2C94C" />
          <circle cx="40" cy="38" r="2.5" fill="#C8102E" />
        </svg>
      )
    case 'papel': {
      const colors = ['#1F8A4C', '#f4f4f4', '#C8102E', '#1F8A4C', '#f4f4f4', '#C8102E']
      const w = size
      const step = w / colors.length
      return (
        <svg {...common} width={w} height={32} viewBox={`0 0 ${w} 32`}>
          <path d={`M0 4 H${w}`} stroke="#bbb" />
          {colors.map((c, i) => (
            <path key={i} d={`M${i * step + 3} 4 H${(i + 1) * step - 3} V24 L${(i + 0.5) * step} 30 L${i * step + 3} 24Z`} fill={c} />
          ))}
        </svg>
      )
    }
  }
}

/** Disfraz del platillo, en el mismo viewBox que el platillo (160 × 90) */
export function SaucerCostume({ id }: { id: SeasonId }) {
  switch (id) {
    case 'anoNuevo':
      return (
        <g>
          <path d="M66 24 L80 -12 L94 24Z" fill="#C9CED6" stroke="#F2C94C" strokeWidth="1.2" />
          <path d="M70 14 L90 8 M68 20 L92 14" stroke="#F2C94C" strokeWidth="2" />
          <circle cx="80" cy="-13" r="4" fill="#F2C94C" />
          <path d="M20 50 C10 66 30 70 22 84 M140 50 C150 66 130 70 138 84" stroke="#F2C94C" strokeWidth="2" fill="none" />
        </g>
      )
    case 'amor':
      return (
        <g>
          <path d="M80 18 V4" stroke="#F2C94C" strokeWidth="1.5" />
          <path d="M80 6 C76 2 71 4 71 8 C71 11 75 13 80 17 C85 13 89 11 89 8 C89 4 84 2 80 6Z" fill="#E8577D" />
        </g>
      )
    case 'nino':
      return (
        <g>
          <path d="M58 28 C58 10 102 10 102 28Z" fill="#3FA9F5" />
          <path d="M60 22 H100" stroke="#F2C94C" strokeWidth="3" />
          <path d="M80 12 V2" stroke="#bbb" strokeWidth="2" />
          <path className="hf-ufo__propeller" d="M64 2 H96" stroke="#FF6B5A" strokeWidth="4" strokeLinecap="round" />
        </g>
      )
    case 'madres':
      return (
        <g>
          {[8, 38, 68, 98, 128].map((x, i) => (
            <g key={x} transform={`translate(${x} 40) scale(.7)`}>
              <circle cx="11" cy="9" r="7.5" fill={i % 2 ? '#F4A6C0' : '#E8577D'} />
              <path d="M11 4 C7 5 6 10 9 12 C12 13 15 10 13 7" stroke="#7a1f3d" strokeWidth="1.2" fill="none" />
            </g>
          ))}
        </g>
      )
    case 'independencia':
      return (
        <g transform="translate(10 54) scale(1 .85)">
          <path d="M0 4 H140" stroke="#bbb" />
          {['#1F8A4C', '#f4f4f4', '#C8102E', '#1F8A4C', '#f4f4f4', '#C8102E'].map((c, i) => (
            <path key={i} d={`M${i * 23.3 + 3} 4 H${(i + 1) * 23.3 - 3} V24 L${(i + 0.5) * 23.3} 30 L${i * 23.3 + 3} 24Z`} fill={c} />
          ))}
        </g>
      )
    case 'halloween':
      return (
        <g>
          <path d="M58 26 L80 -14 L102 26Z" fill="#1a1022" stroke="#7B3FA0" strokeWidth="1.5" />
          <path d="M48 26 H112" stroke="#7B3FA0" strokeWidth="5" strokeLinecap="round" />
          <rect x="72" y="16" width="16" height="5" fill="#F28C28" />
        </g>
      )
    case 'muertos':
      return (
        <g>
          {[10, 40, 70, 100, 130].map((x) => (
            <g key={x} transform={`translate(${x} 46) scale(.55)`}>
              {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
                <ellipse key={a} cx="11" cy="5" rx="3.2" ry="5" fill="#F7A21B" transform={`rotate(${a} 11 11)`} />
              ))}
              <circle cx="11" cy="11" r="3.5" fill="#c46a12" />
            </g>
          ))}
        </g>
      )
    case 'navidad':
      return (
        <g>
          <path d="M54 30 C56 6 92 0 104 24 C110 20 116 26 112 30Z" fill="#C8102E" />
          <path d="M50 30 H110" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
          <circle cx="113" cy="25" r="5" fill="#fff" />
        </g>
      )
  }
}
