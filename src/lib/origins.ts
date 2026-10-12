/**
 * Direcciones de los dos servicios, que viven en orígenes distintos (web y panel separados).
 * En producción se fijan al compilar (`VITE_WEB_URL`, `VITE_PANEL_URL` en .env); en desarrollo, si faltan,
 * se usa el mismo host con el puerto de cada servidor de Vite (web :5173, panel :5180).
 */

const sameHost = (port: number) => `${window.location.protocol}//${window.location.hostname}:${port}`
const clean = (url: string) => url.replace(/\/+$/, '')

/** Web pública, p. ej. https://hathorfrequency.mx */
export const WEB_URL = clean(import.meta.env.VITE_WEB_URL || sameHost(5173))
/** Panel del estudio, p. ej. https://panel.hathorfrequency.mx */
export const PANEL_URL = clean(import.meta.env.VITE_PANEL_URL || sameHost(5180))

export const WEB_ORIGIN = new URL(WEB_URL).origin
export const PANEL_ORIGIN = new URL(PANEL_URL).origin
