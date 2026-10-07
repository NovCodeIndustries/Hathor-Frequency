import { Outlet, ScrollRestoration } from 'react-router'
import { Footer } from '../Footer/Footer'
import { Nav } from '../Nav/Nav'
import { Ticker } from '../Ticker/Ticker'
import './Layout.css'

/** Estructura común de todas las páginas: nav fijo arriba, ticker sobre el footer */
export function Layout() {
  return (
    <div className="hf-layout">
      <Nav />
      <main className="hf-layout__main">
        <Outlet />
      </main>
      <Ticker />
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
