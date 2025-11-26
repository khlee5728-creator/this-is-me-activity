import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://playground.ils.ai.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // /api를 그대로 유지
      },
    },
  },
})
