import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const api = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000'
const site = process.env.SITE_PROXY_TARGET || 'http://127.0.0.1:5173'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Served at /admin/ on the same Vercel project as the portfolio and the API.
  base: '/admin/',
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: '../dist/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    strictPort: true,
    // Same-origin /api in dev, like production, so the session cookie behaves identically.
    // changeOrigin stays off so the API sees the browser's real Host, exactly like on Vercel;
    // its same-origin check compares Origin against Host.
    proxy: {
      '/api': { target: api },
      '/uploads': { target: api }, // local-dev uploads (production uses Vercel Blob URLs)
      // Static assets owned by the public site, so /pictures/... previews resolve in dev.
      '/pictures': { target: site },
      '/icons': { target: site },
      '/files': { target: site },
    },
  },
})
