import { useCallback, useRef, useState } from 'react'
import { sides } from '../../data/artists'
import { socialLabels } from '../../data/site'
import type { Artist } from '../../data/types'
import { Button } from '../shared/Button'
import { Drawer } from '../shared/Drawer'
import { SocialIcon } from '../shared/SocialIcon'
import { MediaPanel, type MediaKind } from './MediaPanel'

interface ArtistDrawerProps {
  artist: Artist
  onClose: () => void
}

/** Mini vinilo que gira junto al nombre */
function MiniVinyl() {
  return (
    <svg className="hf-drawer__disc" viewBox="0 0 440 440" aria-hidden="true" focusable="false">
      <g className="hf-drawer__disc-spin">
        <circle cx="220" cy="220" r="216" fill="#0a0a0a" stroke="#333" />
        <g fill="none" stroke="#F2C94C" strokeOpacity="0.35">
          {[190, 160, 130].map((r) => (
            <circle key={r} cx="220" cy="220" r={r} />
          ))}
        </g>
        <path d="M220 30A190 190 0 0 1 390 140" fill="none" stroke="#F2C94C" strokeWidth="8" />
        <circle cx="220" cy="220" r="90" fill="#F2C94C" />
        <circle cx="220" cy="220" r="10" fill="#000" />
      </g>
    </svg>
  )
}

/**
 * Presentación del artista (diseño V6): panel derecho con bio, redes y galería;
 * "Ver videos" / "Ver fotos" abren el panel izquierdo (MediaPanel).
 */
export function ArtistDrawer({ artist, onClose }: ArtistDrawerProps) {
  const [media, setMedia] = useState<MediaKind | null>(null)
  const [index, setIndex] = useState(0)
  const mediaTrigger = useRef<HTMLButtonElement | null>(null)

  const openMedia = (kind: MediaKind, button: HTMLButtonElement) => {
    mediaTrigger.current = button
    setMedia(kind)
    setIndex(0)
  }

  const closeMedia = useCallback(() => {
    setMedia(null)
    mediaTrigger.current?.focus()
  }, [])

  const items = media ? (artist[media] ?? []) : []
  const hasGallery = Boolean(artist.videos?.length || artist.photos?.length)

  return (
    <Drawer
      kicker={`${artist.code} · ${sides[artist.side].label}`}
      title={artist.name}
      lead={<MiniVinyl />}
      subtitle={<p className="hf-drawer__sub">{artist.genre}</p>}
      onClose={onClose}
      onEscape={media ? closeMedia : onClose}
      aside={
        media &&
        items.length > 0 && (
          <MediaPanel
            artistName={artist.name}
            kind={media}
            items={items}
            index={index}
            onIndex={setIndex}
            onClose={closeMedia}
          />
        )
      }
    >
      {artist.bio && <p className="hf-drawer__desc">{artist.bio}</p>}
      {artist.quote && <blockquote className="hf-drawer__quote">{artist.quote}</blockquote>}

      {artist.socials && artist.socials.length > 0 && (
        <>
          <h3 className="hf-drawer__h3">Redes</h3>
          <ul className="hf-drawer__socials">
            {artist.socials.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${socialLabels[s.platform]} de ${artist.name}`}
                >
                  <SocialIcon platform={s.platform} />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasGallery && (
        <>
          <h3 className="hf-drawer__h3">Galería</h3>
          <div className="hf-drawer__gallery">
            {artist.videos && artist.videos.length > 0 && (
              <button
                type="button"
                aria-pressed={media === 'videos'}
                aria-haspopup="dialog"
                onClick={(e) => openMedia('videos', e.currentTarget)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 4v16l13-8z" />
                </svg>
                Ver videos
              </button>
            )}
            {artist.photos && artist.photos.length > 0 && (
              <button
                type="button"
                aria-pressed={media === 'photos'}
                aria-haspopup="dialog"
                onClick={(e) => openMedia('photos', e.currentTarget)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M21 16l-5-5-8 8" />
                </svg>
                Ver fotos
              </button>
            )}
          </div>
        </>
      )}

      <Button variant="primary" to="/reservar" block className="hf-drawer__cta">
        Reserva tu sesión
      </Button>
    </Drawer>
  )
}
