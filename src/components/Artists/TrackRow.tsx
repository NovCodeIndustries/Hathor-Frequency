import { Link } from 'react-router'
import type { Artist } from '../../data/types'
import { ArtistPattern } from './ArtistPattern'

interface TrackRowProps {
  artist: Artist
  /** Abre el panel del artista (la fila CTA navega a su href) */
  onSelect: (artist: Artist, trigger: HTMLButtonElement) => void
}

export function TrackRow({ artist, onSelect }: TrackRowProps) {
  const content = (
    <>
      <span className="hf-track__code">{artist.code}</span>
      <ArtistPattern pattern={artist.pattern} />
      <span className="hf-track__info">
        <span className="hf-track__name">{artist.name}</span>
        <span className="hf-track__genre">{artist.genre}</span>
      </span>
      <span className="hf-track__arrow" aria-hidden="true">→</span>
    </>
  )

  return (
    <li>
      {artist.cta ? (
        <Link className="hf-track hf-track--cta" to={artist.href}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          className="hf-track"
          aria-haspopup="dialog"
          onClick={(e) => onSelect(artist, e.currentTarget)}
        >
          {content}
        </button>
      )}
    </li>
  )
}
