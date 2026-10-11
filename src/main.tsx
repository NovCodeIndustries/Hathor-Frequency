import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.tsx'
import { loadSiteModules } from './lib/siteModules'

// Primero los módulos apagados (panel · Sitio) para no mostrar un instante lo oculto
loadSiteModules().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
