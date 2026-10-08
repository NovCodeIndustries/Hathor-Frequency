/** Recuerda si el visitante ya vio la bienvenida (solo se muestra en la primera visita) */

const KEY = 'hf-welcome-seen'

export function shouldShowWelcome(): boolean {
  // ?intro fuerza la bienvenida (útil para revisarla)
  if (new URLSearchParams(window.location.search).has('intro')) return true
  try {
    return window.localStorage.getItem(KEY) !== '1'
  } catch {
    // Sin acceso a localStorage (modo privado, bloqueado): no molestar en cada visita
    return false
  }
}

export function markWelcomeSeen(): void {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch {
    /* sin persistencia: no pasa nada */
  }
}
