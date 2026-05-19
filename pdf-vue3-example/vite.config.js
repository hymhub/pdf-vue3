import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'pdf-vue3': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  base: '/pdf-vue3/',
  server: {
    host:'0.0.0.0',
    cors: true,
    open: true,
  }
})
