import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, //จำเป็นสำหรับ Docker
    port: 5173, // Port ที่เราจะใช้
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://backend:5000', //ส่ง request ไปยัง backend service
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
