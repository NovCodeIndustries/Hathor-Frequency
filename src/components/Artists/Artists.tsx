import { artists, artistsIntro, sides } from '../../data/artists'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { TrackRow } from './TrackRow'
import { Vinyl } from './Vinyl'
import './Artists.css'

export function Artists() {
  return (
    <section id="artistas" className="hf-artists hf-container" aria-labelledby="artistas-title">
      <div className="hf-artists__left">
        <div className="hf-artists__title">
          <Eyebrow>Artistas</Eyebrow>
          <h1 id="artistas-title" className="hf-h2">
            Las voces <GoldText>del catálogo.</GoldText>
          </h1>
        </div>
        <Vinyl className="hf-artists__vinyl hf-artists__vinyl--desktop" />
        <Vinyl compact className="hf-artists__vinyl hf-artists__vinyl--mobile" />
      </div>

      <div className="hf-artists__right">
        <p className="hf-lead hf-artists__lead">{artistsIntro}</p>
        {(['A', 'B'] as const).map((side) => (
          <div key={side} className="hf-side">
            <h3 className="hf-side__head">
              <span>{sides[side].label}</span>
              <span className="hf-side__speed" aria-hidden="true">{sides[side].speed}</span>
            </h3>
            <ul>
              {artists
                .filter((a) => a.side === side)
                .map((a) => (
                  <TrackRow key={a.code} artist={a} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
