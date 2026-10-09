import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { levelToDb } from './db'

interface FaderProps {
  label: string
  value: number
  onChange: (value: number) => void
  /** En su posición del easter egg: el cap emite ondas */
  locked?: boolean
}

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)))

/**
 * Fader de consola: vertical en desktop, horizontal en móvil (< 768px).
 * Se arrastra con mouse/touch y se controla con el teclado (role="slider").
 */
export function Fader({ label, value, onChange, locked = false }: FaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const horizontal = useMediaQuery('(max-width: 767px)')

  const valueFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect()
    // Ratio sobre el recorrido útil del cap (largo de la pista menos el cap de 14px)
    const cap = 14
    if (horizontal) {
      return clamp(((e.clientX - rect.left - cap / 2) / (rect.width - cap)) * 100)
    }
    return clamp((1 - (e.clientY - rect.top - cap / 2) / (rect.height - cap)) * 100)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus()
    setDragging(true)
    onChange(valueFromPointer(e))
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) onChange(valueFromPointer(e))
  }

  const stopDrag = () => setDragging(false)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1
    const next: Record<string, number> = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + 10,
      PageDown: value - 10,
      Home: 0,
      End: 100,
    }
    if (e.key in next) {
      e.preventDefault()
      onChange(clamp(next[e.key]))
    }
  }

  return (
    <div
      ref={ref}
      className={`hf-strip__fader ${dragging ? 'is-dragging' : ''} ${locked ? 'is-locked' : ''}`}
      style={{ '--level': value } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={levelToDb(value)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onKeyDown={onKeyDown}
    >
      <span className="hf-strip__track" aria-hidden="true" />
      <span className="hf-strip__cap" aria-hidden="true" />
    </div>
  )
}
