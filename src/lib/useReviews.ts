import { useEffect, useState } from 'react'
import type { Review } from '../data/types'

// Una sola petición por carga de página, compartida entre Opiniones y la rotación de Contacto
let cache: Promise<Review[]> | null = null

function loadReviews(): Promise<Review[]> {
  cache ??= fetch('/api/reviews')
    .then((res) => (res.ok ? (res.json() as Promise<Review[]>) : []))
    .catch(() => [])
    .then((list) => {
      // Si falló, se reintenta en la siguiente vista
      if (list.length === 0) cache = null
      return list
    })
  return cache
}

/** Opiniones publicadas (status PUBLISHED en la tabla `reviews`); `null` mientras cargan */
export function useReviews(): Review[] | null {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  useEffect(() => {
    let alive = true
    loadReviews().then((list) => alive && setReviews(list))
    return () => {
      alive = false
    }
  }, [])
  return reviews
}
