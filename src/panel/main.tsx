import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/tokens.css'
import '../styles/base.css'
import { loadContent } from '../lib/content'
import App from './App'

// Lo publicado (panel · Contenido): Sitio lo usa para nombrar los elementos de las listas
loadContent().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
