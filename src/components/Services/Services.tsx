import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { packages, packagesDisclaimer, packagesIntro, packagesNote } from '../../data/packages'
import { services, servicesIntro } from '../../data/services'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { useSeason } from '../../lib/useSeason'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { AlienSignal } from './AlienSignal'
import { ChannelStrip } from './ChannelStrip'
import { MasterMeter } from './MasterMeter'
import { PackageCard } from './PackageCard'
import { PackageDrawer } from './PackageDrawer'
import { SignalScope } from './SignalScope'
import { WaveTransition, type WavePhase } from './WaveTransition'
import './Services.css'

/**
 * Easter egg: CH1 abajo · CH2 mitad · CH3 arriba · CH4 mitad · CH5 abajo
 * Umbrales: abajo ≤ 15, mitad 40–60, arriba ≥ 85.
 */
type Zone = 'abajo' | 'mitad' | 'arriba'
const SECRET: Zone[] = ['abajo', 'mitad', 'arriba', 'mitad', 'abajo']

const inZone = (level: number, zone: Zone) =>
  zone === 'abajo' ? level <= 15 : zone === 'arriba' ? level >= 85 : level >= 40 && level <= 60

const matchesSecret = (levels: number[]) => SECRET.every((zone, i) => inZone(levels[i], zone))

type View = 'servicios' | 'paquetes'

/** Duración de las ondas: cubrir la página y luego recogerse (ver WaveTransition.css) */
const COVER_MS = 1350
const REVEAL_MS = 1200

/**
 * Al cerrar la señal, tras una pausa, los faders vuelven a su nivel inicial (R2 · Escalonado):
 * cada canal sale RETURN_STAGGER_MS después del anterior y se asienta con un pequeño rebote.
 */
const RETURN_DELAY_MS = 1000
const RETURN_STAGGER_MS = 110
const RETURN_MS = 650
const HOME = services.map((s) => s.level)

/** easeOutBack suave: pasa un poco del objetivo y regresa, como el motor del fader al frenar */
const settle = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2

export function Services() {
  const [levels, setLevels] = useState(HOME)
  // Solo cuentan los faders que el usuario movió (algunos arrancan dentro de su zona)
  const [touched, setTouched] = useState(() => services.map(() => false))
  const [signal, setSignal] = useState(false)
  // La vista vive en la URL (/servicios?vista=paquetes) para poder enlazarla desde otras páginas
  const [params, setParams] = useSearchParams()
  const view: View = params.get('vista') === 'paquetes' ? 'paquetes' : 'servicios'
  const setView = (next: View) => setParams(next === 'paquetes' ? { vista: 'paquetes' } : {}, { replace: true })
  const [wave, setWave] = useState<{ phase: WavePhase; target: View } | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const timers = useRef<number[]>([])
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const season = useSeason()

  // Regreso de los faders: mientras corre, el usuario no puede moverlos
  const returning = useRef(false)
  const returnTimer = useRef(0)
  const returnFrame = useRef(0)

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout)
      window.clearTimeout(returnTimer.current)
      window.cancelAnimationFrame(returnFrame.current)
    },
    [],
  )

  const returnHome = useCallback((from: number[]) => {
    // Al arrancar se apagan las ondas de los caps y el easter egg queda listo para repetirse
    setTouched(services.map(() => false))
    const finish = () => {
      setLevels(HOME)
      returning.current = false
    }
    if (reducedMotion) return finish()
    const start = performance.now()
    const total = RETURN_STAGGER_MS * (HOME.length - 1) + RETURN_MS
    const step = (now: number) => {
      const elapsed = now - start
      if (elapsed >= total) return finish()
      setLevels(
        from.map((f, i) => {
          const t = Math.min(1, Math.max(0, (elapsed - i * RETURN_STAGGER_MS) / RETURN_MS))
          return f + (HOME[i] - f) * settle(t)
        }),
      )
      returnFrame.current = window.requestAnimationFrame(step)
    }
    returnFrame.current = window.requestAnimationFrame(step)
  }, [reducedMotion])

  // Niveles vigentes para que el regreso arranque desde donde quedaron los faders
  const levelsRef = useRef(levels)
  useEffect(() => {
    levelsRef.current = levels
  }, [levels])

  // Referencia estable: AlienSignal reinicia su temporizador de 10 s si cambia onClose
  const closeSignal = useCallback(() => {
    if (returning.current) return
    returning.current = true
    setSignal(false)
    returnTimer.current = window.setTimeout(() => returnHome(levelsRef.current), RETURN_DELAY_MS)
  }, [returnHome])

  const setLevel = (index: number, value: number) => {
    if (returning.current) return
    const next = levels.map((l, i) => (i === index ? value : l))
    // Se dispara solo al entrar en la combinación (no se repite mientras se mantenga)
    if (matchesSecret(next) && !matchesSecret(levels)) setSignal(true)
    setLevels(next)
    if (!touched[index]) setTouched(touched.map((t, i) => t || i === index))
  }

  const locked = levels.map((l, i) => touched[i] && inZone(l, SECRET[i]))
  const lockedCount = locked.filter(Boolean).length

  const switchTo = (target: View) => {
    if (wave || target === view) return
    if (reducedMotion) {
      setView(target)
      return
    }
    setWave({ phase: 'cover', target })
    timers.current.push(
      window.setTimeout(() => {
        // Con la página cubierta: cambia la vista y vuelve arriba
        setView(target)
        window.scrollTo({ top: 0, behavior: 'instant' })
        setWave({ phase: 'reveal', target })
      }, COVER_MS),
      window.setTimeout(() => setWave(null), COVER_MS + REVEAL_MS),
    )
  }

  const openPackage = (index: number, button: HTMLButtonElement) => {
    trigger.current = button
    setOpenIndex(index)
  }

  const closePackage = useCallback(() => {
    setOpenIndex(null)
    trigger.current?.focus()
  }, [])

  const isPackages = view === 'paquetes'

  return (
    <section id="servicios" className="hf-services hf-container" aria-labelledby="servicios-title">
      <div className="hf-services__head">
        <div className="hf-services__title">
          <Eyebrow>{isPackages ? 'Paquetes' : 'Servicios'}</Eyebrow>
          <h1 id="servicios-title" className="hf-h2">
            {isPackages ? (
              <>
                Elige tu disco, <GoldText>nosotros lo prensamos.</GoldText>
              </>
            ) : (
              <>
                Cinco canales, <GoldText>una sola mezcla.</GoldText>
              </>
            )}
          </h1>
        </div>
        <div className="hf-services__side">
          <div className="hf-switch" role="group" aria-label="Cambiar vista">
            <button
              type="button"
              className="hf-switch__btn"
              aria-pressed={!isPackages}
              onClick={() => switchTo('servicios')}
            >
              Servicios
            </button>
            <button
              type="button"
              className="hf-switch__btn"
              aria-pressed={isPackages}
              onClick={() => switchTo('paquetes')}
            >
              Paquetes
            </button>
          </div>
          <p className="hf-lead">{isPackages ? packagesIntro : servicesIntro}</p>
        </div>
      </div>

      {isPackages ? (
        <div className="hf-packages">
          <p className="hf-packages__banner" role="note">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 11v6M12 7.5v.01" />
            </svg>
            <span>
              <strong>{packagesDisclaimer.title}</strong> {packagesDisclaimer.detail}
            </span>
          </p>
          <div className="hf-packages__grid">
            {packages.map((p, i) => (
              <PackageCard key={p.n} pkg={p} onOpen={(button) => openPackage(i, button)} />
            ))}
          </div>
          <p className="hf-packages__note">{packagesNote}</p>
        </div>
      ) : (
        <div className="hf-mixer">
          <SignalScope count={lockedCount} total={SECRET.length} />
          <div className="hf-console">
            {services.map((s, i) => (
              <ChannelStrip key={s.ch} service={s} level={levels[i]} locked={locked[i]} capColor={season?.page.caps[i]} onLevel={(v) => setLevel(i, v)} />
            ))}
            <MasterMeter count={lockedCount} />
          </div>
        </div>
      )}

      {wave && <WaveTransition phase={wave.phase} label={wave.target === 'paquetes' ? 'Paquetes' : 'Servicios'} />}
      {openIndex !== null && <PackageDrawer pkg={packages[openIndex]} onClose={closePackage} />}
      {signal && <AlienSignal onClose={closeSignal} />}
    </section>
  )
}
