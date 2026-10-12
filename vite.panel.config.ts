import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Panel del estudio (servicio `panel`): app aparte de la web, con su propio servidor y build.
 * Entrada en src/panel/index.html; la API del panel (server/panel) corre en :3001.
 */
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const api = `http://localhost:${env.PANEL_API_PORT ?? 3001}`
  const headers = {
    // Nadie puede meter el panel en un iframe, ni indexarlo
    'Content-Security-Policy': "frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
  }
  return {
    root: 'src/panel',
    envDir: process.cwd(),
    publicDir: `${process.cwd()}/public`,
    plugins: [react()],
    build: { outDir: `${process.cwd()}/dist/panel`, emptyOutDir: true },
    server: {
      host: true,
      port: 5180,
      strictPort: true,
      headers,
      proxy: {
        '/api': { target: api, changeOrigin: false, xfwd: true },
        '/media': { target: api, changeOrigin: false },
      },
    },
    preview: { host: true, port: 5180, headers },
  }
})
