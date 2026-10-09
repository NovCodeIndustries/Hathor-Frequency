import { useCallback, useLayoutEffect, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { Footer } from '../Footer/Footer'
import { Nav } from '../Nav/Nav'
import { Ticker } from '../Ticker/Ticker'
import { Ufo } from '../Ufo/Ufo'
import { Welcome } from '../Welcome/Welcome'
import { useSeason } from '../../lib/useSeason'
import './Layout.css'

/** Estructura común de todas las páginas: nav fijo arriba, ticker sobre el footer */
export function Layout() {
  // La bienvenida aparece cada vez que se carga el sitio (no al navegar entre páginas)
  const [welcome, setWelcome] = useState(true)
  const closeWelcome = useCallback(() => setWelcome(false), [])
  const season = useSeason()

  // Acento de la temporada en la raíz: lo heredan las páginas y los modales (que se montan en <body>)
  useLayoutEffect(() => {
    if (!season) return
    const root = document.documentElement
    root.style.setProperty('--season-acc', season.acc)
    root.dataset.season = season.id
    return () => {
      root.style.removeProperty('--season-acc')
      delete root.dataset.season
    }
  }, [season])

  return (
    <div className="hf-layout">
      <Nav />
      <main className="hf-layout__main">
        <Outlet />
      </main>
      <Ticker />
      <Footer />
      <ScrollRestoration />
      {/* El platillo explora todas las vistas; sigue su horario al navegar entre páginas */}
      <Ufo />
      {welcome && <Welcome onDone={closeWelcome} />}
    </div>
  )
}
