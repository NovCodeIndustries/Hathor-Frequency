/**
 * Visitas con Umami (sin cookies). Solo se carga si hay `VITE_UMAMI_WEBSITE_ID` en .env.
 * El script y los envíos van por /umami (proxy de Vite → servicio umami), así funciona también por el túnel.
 * Solo el Layout público lo usa: el panel /admin no se cuenta.
 */

declare global {
  interface Window {
    umami?: { track: (event?: string, data?: Record<string, string | number>) => void }
  }
}

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined
let loading: Promise<void> | null = null

function load(): Promise<void> {
  if (!WEBSITE_ID) return Promise.resolve()
  loading ??= new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = '/umami/script.js'
    s.defer = true
    s.dataset.websiteId = WEBSITE_ID
    s.dataset.hostUrl = '/umami'
    // Las vistas se registran a mano al cambiar de ruta (SPA) para no contar /admin
    s.dataset.autoTrack = 'false'
    s.onload = () => resolve()
    s.onerror = () => resolve()
    document.head.appendChild(s)
  })
  return loading
}

/** Vista de la página actual */
export function trackPageview() {
  load().then(() => window.umami?.track())
}

/** Evento con nombre (p. ej. "reserva-enviada") para medir la conversión */
export function trackEvent(name: string, data?: Record<string, string | number>) {
  load().then(() => window.umami?.track(name, data))
}
