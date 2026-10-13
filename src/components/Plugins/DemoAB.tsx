import { useMemo, useRef, useState } from 'react'
import type { Plugin } from '../../data/types'

type Side = 'before' | 'after'
const BARS = 72

/**
 * Demo "Antes y después" (P2): la misma toma sin y con el plugin. Al cambiar de lado sigue
 * en el mismo segundo, para comparar sin perder el lugar. La onda es decorativa y marca el avance.
 * Para cambiar de plugin, móntalo con `key={plugin.id}` (vuelve a empezar).
 */
export function DemoAB({ plugin, bars = BARS }: { plugin: Plugin; bars?: number }) {
  const before = useRef<HTMLAudioElement>(null)
  const after = useRef<HTMLAudioElement>(null)
  const [side, setSide] = useState<Side>('after')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const heights = useMemo(() => {
    let h = 0
    for (const ch of plugin.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    return Array.from({ length: bars }, (_, i) => 0.18 + Math.abs(Math.sin(i * 0.37 + h) * Math.cos(i * 0.11 + h / 7)) * 0.82)
  }, [plugin.id, bars])

  const audio = (s: Side) => (s === 'before' ? before.current : after.current)

  const pick = (next: Side) => {
    if (next === side) return
    const from = audio(side)
    const to = audio(next)
    if (from && to) {
      to.currentTime = Math.min(from.currentTime, Number.isFinite(to.duration) ? to.duration : from.currentTime)
      if (playing) {
        from.pause()
        void to.play().catch(() => setPlaying(false))
      }
    }
    setSide(next)
  }

  const toggle = () => {
    const a = audio(side)
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const onTime = (s: Side) => () => {
    const a = audio(s)
    if (s === side && a && a.duration) setProgress(a.currentTime / a.duration)
  }

  const done = Math.round(progress * bars)

  return (
    <div className="hf-demo">
      <audio ref={before} src={plugin.demoBefore} preload="none" onTimeUpdate={onTime('before')} onEnded={() => setPlaying(false)} />
      <audio ref={after} src={plugin.demoAfter} preload="none" onTimeUpdate={onTime('after')} onEnded={() => setPlaying(false)} />
      <div className="hf-demo__wave" aria-hidden="true">
        {heights.map((h, i) => (
          <span key={i} className={i < done ? 'is-done' : ''} style={{ height: `${Math.round(h * 100)}%` }} />
        ))}
      </div>
      <div className="hf-demo__controls">
        <button type="button" className="hf-demo__play" aria-label={playing ? 'Pausar demo' : 'Escuchar demo'} onClick={toggle}>
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z" /></svg>
          )}
        </button>
        <div className="hf-demo__ab" role="group" aria-label="Comparar demo">
          <button type="button" className="hf-demo__side" aria-pressed={side === 'before'} onClick={() => pick('before')}>Antes</button>
          <button type="button" className="hf-demo__side" aria-pressed={side === 'after'} onClick={() => pick('after')}>Después</button>
        </div>
      </div>
    </div>
  )
}
