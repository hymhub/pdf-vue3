# pdf-vue3 — Troubleshooting

> Read this when the user reports an error, an unexpected behaviour, or a warning.

## "Use of direct `eval` function is strongly discouraged" build warning

**Cause:** the bundler reached the old `pdfjs-dist@3.7.107` build which contains `eval("require")(this.workerSrc)`.

**Fix:** upgrade to `pdf-vue3@^2.0.0`. The internal pdfjs is now `4.10.38`, which has removed that pattern.

## `The API version "X" does not match the Worker version "Y"`

**Cause:** the loaded worker file is from a different pdfjs version than the API being used (e.g. an old worker cached in a service worker, or a CDN-hosted worker that wasn't updated).

**Fix:**

1. Hard refresh / clear the service worker.
2. If you set `workerSrc` manually, make sure it points to the worker shipped by **the same** `pdfjs-dist` version that `pdf-vue3` depends on. With v2.0.0 the matching worker is `node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`.

## `Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.`

**Cause:** the `src` string was misclassified as base64 because it didn't end with `.pdf`. (This was the root cause of the v1.x bugs #1, #19, #22, #26, #29.)

**Fix:** upgrade to `pdf-vue3@^2.0.0`. The new URL detection accepts:

- `https://…`, `http://…`, `blob:…`, `file:…`
- protocol-relative `//host/…`
- root-relative `/…`
- relative `./…`, `../…`
- regardless of case and query parameters.

If you're on v2 and still see this with a string that _is_ a URL, please file an issue with the exact `src` value — there may be a missing protocol.

## `Error rendering PDF: TypeError: can't access property "parentNode", L is undefined`

**Cause:** v1.x kept rendering work alive after the component was unmounted, and tried to touch the DOM after Vue had removed it.

**Fix:** upgrade to `pdf-vue3@^2.0.0`. v2 sets an `isDestroyed` guard and cancels in-flight render tasks on unmount.

## `Failed to resolve component: PDF`

**Cause:** the user wrote `<PDF />` in a `<template>` but didn't import the component into the SFC.

**Fix:** Add the import:

```vue
<script setup>
import PDF from 'pdf-vue3'
</script>
```

If you want it globally registered (Vue 3 plugin style):

```ts
import { createApp } from 'vue'
import PDF from 'pdf-vue3'

const app = createApp(App)
app.component('PDF', PDF)
```

## "PDF is blurry when I zoom"

**Cause:** the user is zooming via CSS `transform: scale()` (or browser zoom).

**Fix:** use the `scale` prop instead. It re-renders the canvas at the new resolution and stays sharp.

```vue
<PDF src="/file.pdf" :scale="2" />
```

## "Two `<PDF />` on the same page — only one shows"

**Cause:** v1.x kept module-level shared state.

**Fix:** upgrade to `pdf-vue3@^2.0.0`. Each component instance now has its own `loadingTask` / `PDFDocument` / page state.

## "Nuxt 3 says `window is not defined`"

**Cause:** the component is being rendered during SSR.

**Fix:** wrap in `<ClientOnly>` (see `ssr.md`). v2.0.0 itself is SSR-safe (all `window`/`document` accesses are guarded), but rendering a canvas server-side is wasteful.

## "iOS Safari / WeChat browser cuts off the bottom of the PDF"

**Cause:** pdf.js was producing a single huge canvas that exceeded iOS's max texture size.

**Fix:** v2.0.0 renders one canvas per page (instead of one giant scroll surface), so each canvas stays well under the limit. If you still hit it at high `scale`, lower `scale` on mobile (`window.innerWidth < 768`).

## "I can't print on mobile Safari"

**Cause:** iOS Safari blocks `window.print()` inside iframes.

**Workaround:** call `download()` instead and let the OS handle printing from the share sheet.

## "Memory keeps growing as I scroll through a 500-page PDF"

**Cause 1:** `virtual` is set to `false`.

**Fix 1:** remove that — it's `true` by default in v2.

**Cause 2:** you cached `pdfRef.value.getPdf()` somewhere and held it past unmount.

**Fix 2:** release the reference, or call `pdfRef.value.destroy()` before navigating away.

## "Renders fine the first time, but blank after I change `:src`"

**Cause:** the new `src` value didn't parse as expected. v2 emits `onError` for any load failure — listen to it for the real error:

```vue
<PDF :src="dynamicSrc" @on-error="(e) => console.error(e)" />
```

If `e` is something like `MissingPDFException`, the URL is reachable but doesn't return a PDF. If it's `UnexpectedResponseException`, check CORS / auth headers (`httpHeaders`, `withCredentials`).

## "How do I add bookmarks / outline navigation?"

Use `@on-pdf-init` to read the outline:

```ts
const onInit = async (pdf) => {
  const outline = await pdf.getOutline()
  // outline[i].dest is a destination object you can resolve with
  // pdf.getDestination(name) and then call pdfRef.value.goToPage(...)
}
```
