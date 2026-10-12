import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/tokens.css'
import '../styles/base.css'
import { loadContent } from '../lib/content'
import { loadSiteModules } from '../lib/siteModules'
import App from './App'

// Lo publicado (panel · Contenido; Sitio lo usa para nombrar los elementos de las listas) y los módulos del sitio:
// con ellos llega quién cumple años hoy y si las temporadas están encendidas (el panel también las lleva)
Promise.all([loadContent(), loadSiteModules()]).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
