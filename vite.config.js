import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { configureBackendAPI } from './server/api.js'

function mmtopBackendPlugin() {
  return {
    name: 'mmtop-backend-api',
    configureServer(server) {
      configureBackendAPI(server);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mmtopBackendPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  }
})
