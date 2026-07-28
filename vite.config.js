import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://etsy-design-qc-studio.vercel.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
