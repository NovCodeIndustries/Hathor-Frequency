import { pluginStatusLabel } from '../../data/plugins'
import type { Plugin } from '../../data/types'

/** "Gratis", "$1,200", "Próximamente" */
export function priceText(p: Plugin): string {
  if (p.status === 'soon') return pluginStatusLabel.soon
  if (p.free) return p.status === 'beta' ? 'Beta abierta' : 'Gratis'
  return p.price || '$[PRECIO]'
}

/** "VST3 · AU · AAX" (o el estado, si aún no tiene formatos) */
export const formatsText = (p: Plugin) => (p.formats.length ? p.formats.join(' · ') : pluginStatusLabel[p.status])

export const pluginNumber = (i: number) => String(i + 1).padStart(2, '0')

/** Ángulo fijo de cada perilla (de -130° a 130°), para que el mismo plugin siempre se dibuje igual */
export function knobAngle(seed: string): number {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 261) - 130
}
