/**
 * Recorrido de cumpleaños del panel (canvas https://claude.ai/artifact/7As8w3s8PgY9DGpBrKqwC9, B3 + B1 + B4):
 * el alien canta en el login → pastel con velas a pantalla completa → dedicatorias del equipo una a una (L1,
 * canvas https://claude.ai/artifact/HstNRu5Z4tKDXUgXsHTr91) → globos en el panel.
 * Sale una sola vez al día por persona (localStorage); el paso en curso vive en sessionStorage.
 * Si el almacenamiento falla, el recorrido simplemente no se repite ni se recuerda: el panel funciona igual.
 */

export type PartyStage = 'cake' | 'letters' | 'balloons'

const STAGE_KEY = 'hf-bday-stage'
const localDay = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
const doneKey = (userId: string) => `hf-bday-${userId}-${localDay()}`

/** ¿Ya se festejó hoy a esta persona en este navegador? */
export function celebratedToday(userId: string): boolean {
  try {
    return localStorage.getItem(doneKey(userId)) === '1'
  } catch {
    return false
  }
}

/** Empieza el recorrido (y lo marca como visto hoy): el panel abre en el pastel */
export function startParty(userId: string) {
  try {
    localStorage.setItem(doneKey(userId), '1')
  } catch {
    // sin almacenamiento: se festeja igual en esta visita
  }
  setPartyStage('cake')
}

export function partyStage(): PartyStage | null {
  try {
    const v = sessionStorage.getItem(STAGE_KEY)
    return v === 'cake' || v === 'letters' || v === 'balloons' ? v : null
  } catch {
    return null
  }
}

/** null termina el recorrido (o lo salta) */
export function setPartyStage(stage: PartyStage | null) {
  try {
    if (stage) sessionStorage.setItem(STAGE_KEY, stage)
    else sessionStorage.removeItem(STAGE_KEY)
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

/** Firmar la funda de quien cumple (D2): la ventana se abre sola una vez al día por persona */
const askKey = (me: string, recipient: string) => `hf-dedic-${me}-${recipient}-${localDay()}`
export function askedToday(me: string, recipient: string): boolean {
  try {
    return localStorage.getItem(askKey(me, recipient)) === '1'
  } catch {
    return true
  }
}
export function markAsked(me: string, recipient: string) {
  try {
    localStorage.setItem(askKey(me, recipient), '1')
  } catch {
    // sin almacenamiento: el aviso de Inicio sigue ahí
  }
}

export const PARTY_COLORS = ['#F2C94C', '#E8577D', '#3FA9F5', '#7bb342', '#B8860B']
