import type { SocialPlatform } from '../../data/types'

/** Íconos de línea (stroke = currentColor), decorativos */
export function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  }
  switch (platform) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      )
    case 'spotify':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M7 9.5c3.5-1 7.5-.6 10.5 1M7.6 12.6c3-.8 6-.4 8.6 1M8.3 15.6c2.4-.6 4.7-.3 6.7.8" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common} width={22} height={22}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.5 2.6 2.3 4.3 5 4.5" />
        </svg>
      )
  }
}
