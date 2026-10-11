import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Accesible desde fuera del devcontainer
  // allowedHosts: permite compartir por un túnel temporal de Cloudflare (*.trycloudflare.com)
  // proxy: la API (Hono, server/) corre en :3000; el navegador solo habla con Vite.
  // changeOrigin: false conserva el Host original: la API lo compara con el Origin (anti-CSRF del panel)
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': { target: `http://localhost:${process.env.API_PORT ?? 3000}`, changeOrigin: false, xfwd: true },
      // Umami (visitas): script y envíos por el mismo origen del sitio
      '/umami': {
        target: process.env.UMAMI_PROXY_TARGET ?? 'http://localhost:3100',
        changeOrigin: true,
        xfwd: true,
        rewrite: (path) => path.replace(/^\/umami/, ''),
      },
    },
  },
  preview: { host: true, allowedHosts: ['.trycloudflare.com'] },
})
