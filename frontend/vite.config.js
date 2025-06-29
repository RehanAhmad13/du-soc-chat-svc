import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    }
  },
  build: {
    rollupOptions: {
      input: 'index.html',
    }
  },
  resolve: {
    alias: {
      // optional: add aliases here
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  appType: 'spa',  // tells Vite to fallback to index.html
})
