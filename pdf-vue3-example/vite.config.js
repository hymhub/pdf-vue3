import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/pdf-vue3/',
  server: {
    host:'0.0.0.0',
    cors: true,
    open: true,
  }
})
