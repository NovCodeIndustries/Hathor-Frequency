import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Accesible desde fuera del devcontainer
  server: { host: true },
  preview: { host: true },
})
