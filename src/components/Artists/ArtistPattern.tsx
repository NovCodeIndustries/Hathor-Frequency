import type { ArtistPattern as Pattern } from '../../data/types'

export function ArtistPattern({ pattern }: { pattern: Pattern }) {
  if (pattern === 'add') {
    return (
      <svg className="hf-thumb" viewBox="0 0 72 72" aria-hidden="true">
        <rect x="0.5" y="0.5" width="71" height="71" fill="none" stroke="#F2C94C" strokeDasharray="4 4" strokeOpacity="0.7" />
        <path d="M36 26v20M26 36h20" stroke="#F2C94C" strokeWidth="1.5" />
      </svg>
    )
  }

  return (
    <svg className="hf-thumb" viewBox="0 0 72 72" aria-hidden="true">
      <rect width="72" height="72" fill="#0a0a0a" stroke="#333" />
      {pattern === 'circles' && (
        <g fill="none" stroke="#F2C94C" strokeOpacity="0.5">
          {[30, 22, 14, 6].map((r) => (
            <circle key={r} cx="36" cy="36" r={r} />
          ))}
        </g>
      )}
      {pattern === 'diagonals' && (
        <g stroke="#F2C94C" strokeOpacity="0.5">
          {[12, 28, 44, 60].map((n) => (
            <line key={`a${n}`} x1="0" y1={n} x2={n} y2="0" />
          ))}
          {[4, 20, 36, 52].map((n) => (
            <line key={`b${n}`} x1={n} y1="72" x2="72" y2={n} />
          ))}
        </g>
      )}
      {pattern === 'triangles' && (
        <g fill="none" stroke="#F2C94C" strokeOpacity="0.5">
          <path d="M36 8 64 64H8Z" />
          <path d="M36 24 52 56H20Z" />
          <path d="M36 40 42 52H30Z" />
        </g>
      )}
    </svg>
  )
}
