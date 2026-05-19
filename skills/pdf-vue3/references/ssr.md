# pdf-vue3 — SSR / Nuxt 3 integration

> Read this when the user is on Nuxt 3, Vite SSR, or any framework where their components render on the server first.

## TL;DR

```vue
<template>
  <ClientOnly>
    <PDF src="/file.pdf" />
    <template #fallback>
      <div>Loading PDF viewer…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const PDF = defineAsyncComponent(() => import('pdf-vue3'))
</script>
```

The component itself is SSR-safe (every `window` / `document` access is
guarded by `typeof window !== 'undefined'` and lives inside `onBeforeMount`),
but a canvas has no useful SSR markup, so the recommended setup is:

1. Import `pdf-vue3` with `defineAsyncComponent` so its 800 kB+ bundle (which
   contains the pdf.js worker import) does not enter the server bundle.
2. Wrap `<PDF />` in `<ClientOnly>` to prevent SSR rendering of the canvas
   wrapper (avoids a 0-height server-rendered placeholder being measured
   incorrectly during hydration).
3. Provide a small `#fallback` for the brief moment before hydration.

## Recommended `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  build: {
    transpile: ['pdf-vue3'],
  },
  vite: {
    optimizeDeps: {
      include: ['pdf-vue3'],
    },
  },
})
```

- `transpile: ['pdf-vue3']` makes Nuxt 3 treat the package's `.mjs` as
  transpilable for the server bundle (Nitro). Without this, some legacy
  Webpack-based Nuxt setups fall over.
- `optimizeDeps.include` lets Vite pre-bundle the dep on first `dev` run
  (avoids a noticeable cold-start when the user first opens the page).

## Custom `workerSrc` in Nuxt / Electron

The default worker URL is computed at build time with
`new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url)`.
This works in Vite, Nuxt 3, and modern Webpack 5 setups out of the box.

If you ship in an unusual environment (e.g. Electron with a custom asar
layout) where that URL cannot be resolved, host the worker file yourself and
pass the absolute URL:

```vue
<PDF
  src="/file.pdf"
  worker-src="/static/pdf.worker.mjs"
/>
```

You can copy the worker from `node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`.

## Common SSR pitfalls

### `ReferenceError: window is not defined`

Cause: rendering `<PDF />` outside of `<ClientOnly>` while Nuxt is generating
static pages, **and** the user is on a `pdf-vue3@1.x` build.

Fix: upgrade to `pdf-vue3@>=2.0.1` and/or wrap in `<ClientOnly>`.

### Hydration mismatch warning

Cause: server rendered the canvas placeholder at the natural width, client
rendered it at the actual container width.

Fix: use `<ClientOnly>` — the canvas wrapper is skipped on the server.

### "Module not found: Can't resolve `pdfjs-dist`" in CI

Cause: the SSR build couldn't resolve the optional `@napi-rs/canvas`
peer that `pdfjs-dist` declares but doesn't actually need on the client.

Fix: it's already a `optionalDependencies`, so let npm/pnpm install it; or
add to the SSR build's `external` list:

```ts
nitro: {
  externals: { inline: ['pdf-vue3'], external: ['pdfjs-dist'] },
}
```

## Full Nuxt 3 example

See `pdf-vue3-example-ssr/` in the repo. It demonstrates `ClientOnly`,
controlled page, scale, print, and download — all SSR-safe.
