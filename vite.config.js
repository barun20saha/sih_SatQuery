import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Pin the dev server to port 5173 so it never silently drifts to 5174.
    // If 5173 is in use, this causes an explicit error instead of a silent
    // rebind — which would break every hardcoded URL in CORS, .env, etc.
    port: 5173,
    strictPort: true,     // fail loudly instead of silently switching ports

    // Allow the Spring Boot Gateway to reverse-proxy to Vite
    host: '127.0.0.1',
  },
})
