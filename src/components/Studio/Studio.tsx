import { useEffect, useState, type CSSProperties } from 'react'
import { studioGear, studioRooms, studioTourInterval, studioVideo, studioVisit } from '../../data/studio'
import type { StudioVideoService } from '../../data/types'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Button } from '../shared/Button'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import './Studio.css'

const total = studioRooms.length
const pad = (n: number) => String(n).padStart(2, '0')

/** Foto o, mientras no la haya, un marcador con anillos */
function Photo({ src, label, prefix = 'FOTO', className = '' }: { src?: string; label: string; prefix?: string; className?: string }) {
  return (
    <div className={`hf-photo ${className}`}>
      {src ? (
        <img src={src} alt={label} loading="lazy" />
      ) : (
        <>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" focusable="false">
            {[42, 30, 18].map((r) => (
              <circle key={r} cx="50" cy="50" r={r} stroke="#F2C94C" strokeOpacity="0.12" />
            ))}
          </svg>
          <span>
            [{prefix}: {label}]
          </span>
        </>
      )}
    </div>
  )
}

/** Tarjeta de videoclip / live session: muestra de video, proceso e incluye */
function VideoCard({ service }: { service: StudioVideoService }) {
  const [playing, setPlaying] = useState(false)
  return (
    <article className="hf-vid__card">
      <div className="hf-vid__screen">
        {service.embed && playing ? (
          <iframe
            src={`${service.embed}${service.embed.includes('?') ? '&' : '?'}autoplay=1`}
            title={service.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <Photo prefix="VIDEO DE MUESTRA" label={service.title} />
            <span className="hf-vid__playwrap">
              <span className="hf-vid__ripple" aria-hidden="true" />
              <span className="hf-vid__ripple" aria-hidden="true" />
              {service.embed ? (
                <button type="button" className="hf-vid__play" aria-label={`Reproducir muestra de ${service.title}`} onClick={() => setPlaying(true)}>
                  <PlayIcon />
                </button>
              ) : (
                <span className="hf-vid__play" aria-hidden="true">
                  <PlayIcon />
                </span>
              )}
            </span>
          </>
        )}
        <span className="hf-vid__tag">{service.tag}</span>
      </div>
      <div className="hf-vid__body">
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <ol className="hf-vid__steps" aria-label="Proceso">
          {service.steps.map((step, i) => (
            <li key={step}>
              <span>{pad(i + 1)}</span>
              {step}
            </li>
          ))}
        </ol>
        <ul className="hf-vid__includes">
          {service.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

/**
 * Estudio (diseño E2 · Tour con galería): tour por los espacios que avanza solo
 * (se pausa con el mouse encima, con foco dentro, con el botón de pausa o con reduced-motion),
 * videos y live sessions, equipo en pestañas y datos de visita.
 */
export function Studio() {
  const [room, setRoom] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tab, setTab] = useState(0)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const running = !paused && !hovered && !reducedMotion

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => setRoom((r) => (r + 1) % total), studioTourInterval)
    return () => window.clearTimeout(id)
  }, [running, room])

  const go = (i: number) => setRoom((i + total) % total)
  const current = studioRooms[room]
  const gear = studioGear[tab]

  return (
    <div className="hf-studio">
      {/* Tour */}
      <section
        className="hf-tour"
        aria-labelledby="estudio-title"
        aria-roledescription="carrusel"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
        }}
        style={{ '--tour-interval': `${studioTourInterval}ms` } as CSSProperties}
      >
        <div className="hf-tour__slides" aria-hidden="true">
          {studioRooms.map((r, i) => (
            <Photo key={r.n} src={r.src} label={r.name} className={`hf-tour__slide ${i === room ? 'is-current' : ''}`} />
          ))}
        </div>
        <div className="hf-tour__shade" aria-hidden="true" />

        <div className="hf-tour__text hf-container" aria-live={running ? 'off' : 'polite'}>
          <Eyebrow>Estudio · Tour</Eyebrow>
          <h1 id="estudio-title" className="hf-tour__title">
            Entra {current.article} <GoldText>{current.name}.</GoldText>
          </h1>
          <p className="hf-tour__desc">{current.description}</p>
          <p className="hf-tour__meta">
            Espacio {current.n} de {pad(total)} · {current.size}
          </p>
        </div>

        <div className="hf-tour__controls hf-container">
          <button type="button" className="hf-transport" aria-label="Espacio anterior" onClick={() => go(room - 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 5h2v14H6zM20 5v14L9 12z" />
            </svg>
          </button>
          <div className="hf-tour__thumbs">
            {studioRooms.map((r, i) => (
              <button
                key={r.n}
                type="button"
                className="hf-tour__thumb"
                aria-label={`${r.n} · ${r.name}`}
                aria-pressed={i === room}
                onClick={() => go(i)}
              >
                <span className="hf-tour__thumb-label">
                  {r.n}
                  <span> · {r.name}</span>
                </span>
                {/* Avance del tiempo en el espacio actual */}
                {i === room && running && <span key={room} className="hf-tour__progress" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <button type="button" className="hf-transport" aria-label="Siguiente espacio" onClick={() => go(room + 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
            </svg>
          </button>
          {!reducedMotion && (
            <button
              type="button"
              className="hf-transport hf-transport--small"
              aria-label={paused ? 'Reanudar el tour' : 'Pausar el tour'}
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </section>

      {/* Videos musicales y live sessions */}
      <section className="hf-vid hf-container" aria-labelledby="video-title">
        <div className="hf-vid__head">
          <div className="hf-vid__intro">
            <Eyebrow>Video y live sessions</Eyebrow>
            <h2 id="video-title" className="hf-h2 hf-studio__h2">
              Tu música <GoldText>también se ve.</GoldText>
            </h2>
          </div>
          <p className="hf-lead">
            El mismo equipo que graba tu música la lleva a la pantalla: videoclips con concepto y live sessions
            filmadas en el estudio.
          </p>
        </div>
        <div className="hf-vid__grid">
          {studioVideo.map((v) => (
            <VideoCard key={v.title} service={v} />
          ))}
        </div>
        <div className="hf-vid__actions">
          <Button variant="primary" to="/servicios?vista=paquetes">Cotizar un video</Button>
          <Button variant="ghost" to="/reservar">Reservar sesión</Button>
        </div>
      </section>

      {/* Equipo */}
      <section className="hf-gear hf-container" aria-labelledby="equipo-title">
        <div className="hf-gear__intro">
          <Eyebrow>Equipo</Eyebrow>
          <h2 id="equipo-title" className="hf-h2 hf-studio__h2">
            Todo conectado, <GoldText>listo para tocar.</GoldText>
          </h2>
          <p className="hf-lead">Si prefieres tu propio equipo, tráelo: lo integramos a la sesión.</p>
        </div>
        <div className="hf-gear__body">
          <div className="hf-gear__tabs" role="tablist" aria-label="Categorías de equipo">
            {studioGear.map((g, i) => (
              <button
                key={g.label}
                id={`gear-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === tab}
                aria-controls="gear-panel"
                tabIndex={i === tab ? 0 : -1}
                onClick={() => setTab(i)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                  const next = (tab + (e.key === 'ArrowRight' ? 1 : -1) + studioGear.length) % studioGear.length
                  setTab(next)
                  document.getElementById(`gear-tab-${next}`)?.focus()
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div id="gear-panel" className="hf-gear__panel" role="tabpanel" aria-labelledby={`gear-tab-${tab}`}>
            <Photo src={gear.src} label={gear.label} />
            <div className="hf-gear__text">
              <h3>{gear.label}</h3>
              <p>{gear.value}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visita */}
      <section className="hf-visit hf-container" aria-labelledby="visita-title">
        <div className="hf-visit__head">
          <h2 id="visita-title" className="hf-h2 hf-studio__h2">
            Ven a <GoldText>escucharlo.</GoldText>
          </h2>
          <div className="hf-visit__actions">
            <Button variant="primary" to="/reservar">Reservar sesión</Button>
            <Button variant="ghost" to="/contacto">Agendar visita</Button>
          </div>
        </div>
        <dl className="hf-visit__info">
          {studioVisit.map((v) => (
            <div key={v.label}>
              <dt>{v.label}</dt>
              <dd>{v.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
