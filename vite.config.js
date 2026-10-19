import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // Needed for Docker mapping
    strictPort: true,
    port: 5173,
    // Same-origin /api in dev, like production on Vercel. (Inside Docker, set VITE_API_URL instead.)
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000' },
      '/uploads': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000' }, // local-dev uploads
    },
  },
})
