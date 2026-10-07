import { Link } from 'react-router'
import type { Artist } from '../../data/types'
import { ArtistPattern } from './ArtistPattern'

export function TrackRow({ artist }: { artist: Artist }) {
  return (
    <li>
      <Link className={`hf-track ${artist.cta ? 'hf-track--cta' : ''}`} to={artist.href}>
        <span className="hf-track__code">{artist.code}</span>
        <ArtistPattern pattern={artist.pattern} />
        <span className="hf-track__info">
          <span className="hf-track__name">{artist.name}</span>
          <span className="hf-track__genre">{artist.genre}</span>
        </span>
        <span className="hf-track__arrow" aria-hidden="true">→</span>
      </Link>
    </li>
  )
}
