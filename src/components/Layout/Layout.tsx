import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { Footer } from '../Footer/Footer'
import { Nav } from '../Nav/Nav'
import { Ticker } from '../Ticker/Ticker'
import { Ufo } from '../Ufo/Ufo'
import { Welcome } from '../Welcome/Welcome'
import { trackPageview } from '../../lib/analytics'
import { isEditMode, isPanelFrame, postToPanel, useMaintenance, useModule } from '../../lib/siteModules'
import { Maintenance } from '../Maintenance/Maintenance'
import { useSeason } from '../../lib/useSeason'
import './Layout.css'
import { Module } from '../shared/Module'

/** Estructura común de todas las páginas: nav fijo arriba, ticker sobre el footer */
export function Layout() {
  // La bienvenida aparece cada vez que se carga el sitio (no al navegar entre páginas)
  const [welcome, setWelcome] = useState(true)
  const closeWelcome = useCallback(() => setWelcome(false), [])
  const season = useSeason()
  const { pathname } = useLocation()
  const showTicker = useModule('global.ticker')
  const showUfo = useModule('global.ufo')
  const showWelcome = useModule('global.welcome')
  const maintenance = useMaintenance()

  // Una vista de Umami por ruta pública; en el modo edición del panel no se cuenta y se avisa la ruta al panel
  const { search } = useLocation()
  useEffect(() => {
    if (isEditMode()) postToPanel({ type: 'hf-edit-route', path: pathname + search })
    else if (!isPanelFrame() && !maintenance) trackPageview()
  }, [pathname, search, maintenance])

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

  // Web en mantenimiento (panel · Sitio): todas las rutas muestran la misma pantalla, sin nav ni footer
  if (maintenance) return <Maintenance state={maintenance} />

  return (
    <div className="hf-layout">
      <Nav />
      <main className="hf-layout__main">
        <Outlet />
      </main>
      {showTicker && (
        <Module id="global.ticker">
          <Ticker />
        </Module>
      )}
      <Footer />
      <ScrollRestoration />
      {/* El platillo explora todas las vistas; sigue su horario al navegar entre páginas */}
      {showUfo && <Ufo />}
      {welcome && showWelcome && <Welcome onDone={closeWelcome} />}
    </div>
  )
}
