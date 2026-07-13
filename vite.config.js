import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In docker, nginx proxies /api and /.well-known to the api service.
// For `npm run dev`, proxy them to the local API on :8080.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/.well-known': 'http://localhost:8080'
    }
  }
})
