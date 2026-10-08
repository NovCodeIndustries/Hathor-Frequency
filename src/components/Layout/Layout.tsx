import { useCallback, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { markWelcomeSeen, shouldShowWelcome } from '../../lib/welcome'
import { Footer } from '../Footer/Footer'
import { Nav } from '../Nav/Nav'
import { Ticker } from '../Ticker/Ticker'
import { Welcome } from '../Welcome/Welcome'
import './Layout.css'

/** Estructura común de todas las páginas: nav fijo arriba, ticker sobre el footer */
export function Layout() {
  const [welcome, setWelcome] = useState(shouldShowWelcome)
  const closeWelcome = useCallback(() => {
    markWelcomeSeen()
    setWelcome(false)
  }, [])

  return (
    <div className="hf-layout">
      <Nav />
      <main className="hf-layout__main">
        <Outlet />
      </main>
      <Ticker />
      <Footer />
      <ScrollRestoration />
      {welcome && <Welcome onDone={closeWelcome} />}
    </div>
  )
}
