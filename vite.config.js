import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2018',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
