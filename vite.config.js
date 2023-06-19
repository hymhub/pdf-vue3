import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'pdf-vue3',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue']
    }
  }
});
