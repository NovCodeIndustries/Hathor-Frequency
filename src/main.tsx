import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.tsx'
import { loadContent } from './lib/content'
import { startLive } from './lib/live'
import { isPanelFrame, loadSiteModules } from './lib/siteModules'

// Primero los módulos apagados (panel · Sitio) y el contenido publicado (panel · Contenido),
// para no mostrar un instante lo viejo; después el canal en vivo (fuera de las vistas previas del panel)
Promise.all([loadSiteModules(), loadContent()]).finally(() => {
  if (!isPanelFrame()) startLive()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
