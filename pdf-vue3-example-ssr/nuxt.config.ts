// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['@/style.css'],
  // pdf-vue3 dynamically imports pdfjs-dist (an ESM-only package in v4+).
  // Mark it as a CJS-incompatible/native ESM dep so Nuxt's Nitro server bundles
  // it correctly during SSR builds (it stays inert at SSR since the component
  // only runs in onBeforeMount on the client).
  build: {
    transpile: ['pdf-vue3'],
  },
  nitro: {
    moduleSideEffects: ['pdfjs-dist'],
  },
  vite: {
    optimizeDeps: {
      include: ['pdf-vue3'],
    },
  },
})
