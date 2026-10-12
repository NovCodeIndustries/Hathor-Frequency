import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// Web pública (servicio `web`). El panel es otra app: vite.panel.config.ts
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const api = `http://localhost:${env.WEB_API_PORT ?? 3000}`
  // Solo el panel puede meter la web en un iframe (modo edición y vista previa)
  const frameAncestors = `frame-ancestors 'self' ${env.VITE_PANEL_URL || 'http://*:5180 https://*:5180'}`
  return {
    plugins: [react()],
    // Sin el panel, la web es un solo chunk de ~500 kB (150 kB gzip)
    build: { outDir: 'dist/web', emptyOutDir: true, chunkSizeWarningLimit: 600 },
    // Accesible desde fuera del devcontainer
    // allowedHosts: permite compartir por un túnel temporal de Cloudflare (*.trycloudflare.com)
    // proxy: la API de la web (Hono, server/web) corre en :3000; el navegador solo habla con Vite.
    // changeOrigin: false conserva el Host original: la API lo compara con el Origin (anti-CSRF)
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: ['.trycloudflare.com'],
      headers: { 'Content-Security-Policy': frameAncestors },
      proxy: {
        '/api': { target: api, changeOrigin: false, xfwd: true },
        // Fotos y videos del HDD de medios (los sirve la API)
        '/media': { target: api, changeOrigin: false },
        // Umami (visitas): script y envíos por el mismo origen del sitio
        '/umami': {
          target: env.UMAMI_PROXY_TARGET ?? 'http://localhost:3100',
          changeOrigin: true,
          xfwd: true,
          rewrite: (path) => path.replace(/^\/umami/, ''),
        },
      },
    },
    preview: { host: true, port: 5173, allowedHosts: ['.trycloudflare.com'], headers: { 'Content-Security-Policy': frameAncestors } },
  }
})
