import type { Ref } from 'react'

/**
 * Campo trampa contra bots: oculto para personas y lectores de pantalla.
 * Si llega con texto, la API responde OK sin guardar nada (server/schemas.ts · honeypot).
 */
export function Honeypot({ ref }: { ref: Ref<HTMLInputElement> }) {
  return (
    <input ref={ref} className="hf-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
  )
}
