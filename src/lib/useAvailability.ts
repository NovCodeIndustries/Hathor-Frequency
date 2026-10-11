import { useCallback, useEffect, useState } from 'react'
import type { YearMonth } from './calendar'

/** Respuesta de `GET /api/availability?month=YYYY-MM` (server/lib/availability.ts) */
export interface Availability {
  /** Horarios ocupados por día "YYYY-MM-DD" */
  taken: Record<string, string[]>
  /** Días cerrados o sin horarios libres */
  blockedDays: string[]
}

const EMPTY: Availability = { taken: {}, blockedDays: [] }

const monthKey = ({ year, month }: YearMonth) => `${year}-${String(month + 1).padStart(2, '0')}`

/**
 * Disponibilidad del mes visible. Si la API no responde se muestra todo libre:
 * la API vuelve a validar al reservar y responde 409 si el horario ya no está.
 */
export function useAvailability(month: YearMonth): { availability: Availability; refresh: () => void } {
  const key = monthKey(month)
  const [state, setState] = useState<{ key: string; data: Availability }>({ key, data: EMPTY })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/availability?month=${key}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Availability>) : EMPTY))
      .then((data) => setState({ key, data }))
      .catch(() => {})
    return () => ctrl.abort()
  }, [key, tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])
  return { availability: state.key === key ? state.data : EMPTY, refresh }
}
