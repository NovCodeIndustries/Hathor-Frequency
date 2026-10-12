import { useCallback, useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { guideTargetVisible, type Guide, type GuideStep } from './guides'
import './PanelGuide.css'

interface Box { top: number; left: number; width: number; height: number }

const PAD = 8
const GAP = 20
const EDGE = 16
const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height)

/** Carita del alien narrador; `look` mueve los ojos hacia lo que explica (-1…1) */
function GuideAlien({ className, look = { x: 0, y: 0 }, label }: { className: string; look?: { x: number; y: number }; label?: string }) {
  const ex = look.x * 4
  const ey = 46 + look.y * 4
  return (
    <svg className={className} viewBox="-15 -12 150 114" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path className="hf-pguide__skin" d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" />
      <path className="hf-pguide__eye" d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z" />
      <path className="hf-pguide__eye" d="M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" />
      <circle cx={40 + ex} cy={ey} r="2.6" fill="#fff" />
      <circle cx={80 + ex} cy={ey} r="2.6" fill="#fff" />
      <path className="hf-pguide__line" d="M50 76 C56 81 64 81 70 76" />
      <path className="hf-pguide__band" d="M14 52 C12 -12 108 -12 106 52" />
      <rect className="hf-pguide__cup" x="6" y="36" width="20" height="34" rx="9" />
      <rect className="hf-pguide__cup" x="94" y="36" width="20" height="34" rx="9" />
    </svg>
  )
}

/** Botón fijo abajo a la derecha para volver a ver la guía del módulo */
export function GuideHelpButton({ guide, onOpen }: { guide: Guide; onOpen: () => void }) {
  return (
    <button type="button" className="hf-pguide__help" data-guide="help" onClick={onOpen} aria-label={`Ver la guía de ${guide.name}`}>
      <svg width="26" height="24" viewBox="-15 -12 150 114" aria-hidden="true">
        <path d="M60 6 C88 6 101 28 99 50 C97 72 77 94 60 96 C43 94 23 72 21 50 C19 28 32 6 60 6Z" fill="#2a2d31" stroke="#F2C94C" strokeWidth="5" />
        <path d="M14 52 C12 -12 108 -12 106 52" fill="none" stroke="#F2C94C" strokeWidth="9" strokeLinecap="round" />
        <path d="M30 48 C36 36 54 40 56 56 C48 64 34 62 30 48Z M90 48 C84 36 66 40 64 56 C72 64 86 62 90 48Z" fill="#000" stroke="#F2C94C" strokeWidth="4" />
      </svg>
      <span className="hf-pguide__help-text">Guía de {guide.name}</span>
    </button>
  )
}

/**
 * Guía de un módulo del panel (G5 escritorio · M2 móvil): todo se oscurece salvo la parte que se explica,
 * con un anillo dorado que late, y el alien del estudio la narra en su globo (en móvil, en una hoja abajo).
 */
export function PanelGuide({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const mobile = useMediaQuery('(max-width: 767px)')
  // Los pasos que se ven en esta pantalla, fijados al abrir
  const [steps] = useState<GuideStep[]>(() => guide.steps.filter((s) => !s.target || guideTargetVisible(s.target)))
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [size, setSize] = useState({ w: 452, h: 260 })
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight })
  const guideRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = steps[i]
  const last = i === steps.length - 1

  const next = useCallback(() => (last ? onClose() : setI((n) => n + 1)), [last, onClose])
  const prev = useCallback(() => setI((n) => Math.max(0, n - 1)), [])

  // Teclado: Esc cierra y las flechas avanzan o regresan; al cerrar, el foco vuelve a donde estaba
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [next, prev, onClose])

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [i])

  // Lleva el elemento a la vista (en móvil, por encima de la hoja) y lo sigue midiendo mientras se mueve
  useEffect(() => {
    const el = step?.target ? (document.querySelector(step.target) as HTMLElement | null) : null
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sheet = mobile ? (guideRef.current?.offsetHeight ?? 240) : 0
    // Cabecera fija del panel en móvil y tablet: lo iluminado no debe quedar debajo
    const side = document.querySelector('.hf-admin__side')
    const bar = side?.getBoundingClientRect()
    const onTop = side && bar && !side.contains(el) && bar.width >= window.innerWidth * 0.9 && /sticky|fixed/.test(getComputedStyle(side).position)
    const inset = onTop ? Math.max(0, Math.round(bar.bottom)) : 0
    const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6
    // Lo fijo (el botón de ayuda) ya está a la vista
    if (getComputedStyle(el).position !== 'fixed') {
      const prevMargin = [el.style.scrollMarginTop, el.style.scrollMarginBottom]
      el.style.scrollMarginTop = `${inset + 24}px`
      el.style.scrollMarginBottom = `${sheet + 24}px`
      el.scrollIntoView({ block: tall ? 'start' : mobile ? 'nearest' : 'center', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
      ;[el.style.scrollMarginTop, el.style.scrollMarginBottom] = prevMargin
    }
    let raf = 0
    const measure = () => {
      const r = el.getBoundingClientRect()
      const top = Math.max(Math.round(r.top), inset)
      const b = r.width > 0 && r.bottom > top ? { top, left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.bottom) - top } : null
      setBox((old) => (sameBox(old, b) ? old : b))
      setView((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }))
      raf = requestAnimationFrame(measure)
    }
    measure()
    return () => cancelAnimationFrame(raf)
  }, [step, mobile])

  // Tamaño real del alien con su globo (cambia con cada texto)
  useEffect(() => {
    const g = guideRef.current
    if (!g) return
    const ro = new ResizeObserver(() => setSize((o) => (o.w === g.offsetWidth && o.h === g.offsetHeight ? o : { w: g.offsetWidth, h: g.offsetHeight })))
    ro.observe(g)
    return () => ro.disconnect()
  }, [i, mobile])

  if (!step) return null

  // Anillo: el elemento con margen, recortado a la pantalla
  const lit = step.target ? box : null
  const ring = lit && {
    left: Math.max(4, lit.left - PAD),
    top: Math.max(4, lit.top - PAD),
    right: Math.min(view.w - 4, lit.left + lit.width + PAD),
    bottom: Math.min(view.h - 4, lit.top + lit.height + PAD),
  }

  // Escritorio: el alien y su globo abajo, arriba, a la izquierda o a la derecha, donde quepan
  let pos = { left: (view.w - size.w) / 2, top: (view.h - size.h) / 2 }
  if (!mobile && ring) {
    const clampX = (x: number) => Math.min(Math.max(x, EDGE), view.w - size.w - EDGE)
    const clampY = (y: number) => Math.min(Math.max(y, EDGE), view.h - size.h - EDGE)
    const midY = clampY((ring.top + ring.bottom) / 2 - size.h / 2)
    const options = [
      { left: clampX(ring.left), top: ring.bottom + GAP, ok: ring.bottom + GAP + size.h <= view.h - EDGE },
      { left: clampX(ring.left), top: ring.top - GAP - size.h, ok: ring.top - GAP - size.h >= EDGE },
      { left: ring.left - GAP - size.w, top: midY, ok: ring.left - GAP - size.w >= EDGE },
      { left: ring.right + GAP, top: midY, ok: ring.right + GAP + size.w <= view.w - EDGE },
    ]
    // Si no cabe fuera (algo muy grande), va dentro, en la esquina de abajo
    pos = options.find((o) => o.ok) ?? { left: view.w - size.w - EDGE * 2, top: view.h - size.h - EDGE * 2 }
  }

  // Los ojos miran hacia lo iluminado
  let look = { x: 0, y: 0 }
  if (ring && !mobile) {
    const dx = (ring.left + ring.right) / 2 - (pos.left + 48)
    const dy = (ring.top + ring.bottom) / 2 - (pos.top + size.h - 48)
    const d = Math.hypot(dx, dy) || 1
    look = { x: dx / d, y: dy / d }
  }

  // Móvil: si lo iluminado queda tapado por la hoja (algo fijo, como el botón de ayuda), la hoja sube
  const lift = mobile && ring && ring.bottom > view.h - size.h && ring.top - size.h - 14 >= EDGE ? view.h - ring.top + 14 : 0

  const counter = i === 0 && !step.target ? `Guía · ${guide.name}` : `${guide.name} · ${i} de ${steps.length - 1}`
  const nextLabel = i === 0 && !step.target ? 'Empezar' : last ? 'Terminar' : 'Siguiente'

  return (
    <div className={`hf-pguide ${mobile ? 'is-mobile' : ''}`}>
      {/* Los clics no pasan al panel mientras dura la guía */}
      <div className="hf-pguide__block" aria-hidden="true" />
      {ring ? (
        <div
          className="hf-pguide__ring"
          aria-hidden="true"
          style={{ left: ring.left, top: ring.top, width: ring.right - ring.left, height: ring.bottom - ring.top }}
        />
      ) : (
        <div className="hf-pguide__dim" aria-hidden="true" />
      )}
      {/* Bienvenida: el alien baja en el rayo del platillo */}
      {!step.target && !mobile && (
        <div className="hf-pguide__beam" aria-hidden="true" style={{ left: pos.left - 72, height: pos.top + 100 }} />
      )}

      <div
        ref={guideRef}
        key={mobile ? `s${i}` : 'g'}
        className={mobile ? `hf-pguide__sheet ${lift ? 'is-lifted' : ''}` : 'hf-pguide__guide'}
        style={mobile ? (lift ? { bottom: lift } : undefined) : { left: pos.left, top: pos.top }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hf-pguide-title"
        aria-describedby="hf-pguide-text"
      >
        <GuideAlien
          className="hf-pguide__alien"
          look={look}
          label={`El alien del estudio te explica ${guide.name}`}
        />
        <div className="hf-pguide__bubble" key={i} aria-live="polite">
          <div className="hf-pguide__top">
            <span className="hf-pguide__counter">{counter}</span>
            <button type="button" className="hf-pguide__skip" onClick={onClose}>
              {mobile ? 'Saltar' : 'Saltar guía'}
            </button>
          </div>
          <h2 id="hf-pguide-title" className="hf-pguide__say">{step.say}</h2>
          <p id="hf-pguide-text" className="hf-pguide__text">{step.text}</p>
          {step.tip && <p className="hf-pguide__tip">{step.tip}</p>}
          <div className="hf-pguide__foot">
            {!mobile && (
              <div className="hf-pguide__dots" aria-hidden="true">
                {steps.map((_, k) => (
                  <span key={k} className={`hf-pguide__dot ${k === i ? 'is-now' : k < i ? 'is-done' : ''}`} />
                ))}
              </div>
            )}
            <div className="hf-pguide__nav">
              {i > 0 && (
                <button type="button" className="hf-pguide__back" onClick={prev} aria-label={mobile ? 'Paso anterior' : undefined}>
                  {mobile ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
                  ) : (
                    'Anterior'
                  )}
                </button>
              )}
              <button ref={nextRef} type="button" className="hf-pguide__next" onClick={next}>
                {nextLabel}
              </button>
            </div>
          </div>
          {!mobile && <span className="hf-pguide__tail" aria-hidden="true" />}
        </div>
      </div>
    </div>
  )
}
