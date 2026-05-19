# pdf-vue3 — Usage reference

> Read this when the user asks _how_ to use a feature: props, events, slots, exposed methods, or wants concrete code.

## Install

```bash
npm i pdf-vue3
```

Peer requirement: Vue `^3.2`. Bundler must understand `.mjs` (Vite, Webpack 5, Rollup, Nuxt 3 — all OK by default).

## Minimal usage

```vue
<script setup>
import PDF from 'pdf-vue3'
</script>

<template>
  <PDF src="/file.pdf" />
  <!-- <PDF :src="base64String" /> -->
  <!-- <PDF :src="uint8Array" /> -->
</template>
```

The `src` prop accepts:

- An absolute URL (`https://…`, `http://…`, `blob:…`, `file:…`).
- A protocol-relative URL (`//cdn.example.com/file.pdf`).
- A root-relative or relative path (`/file.pdf`, `./file.pdf`, `../file.pdf`).
- A `data:application/pdf;base64,…` URI.
- A raw base64 string (no prefix).
- A `Uint8Array` of the raw PDF bytes.

URL detection is case-insensitive and tolerant of query parameters (S3 presigned URLs, `?token=…`, etc.).

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `src` | `string \| Uint8Array` | (required) | See `src` formats above. |
| `scale` | `number` | `1` | Zoom factor. Pages re-render at the new resolution (sharp at any factor). |
| `virtual` | `boolean` | `true` | Render only pages near the viewport. Set `false` if you need every canvas in the DOM. |
| `preloadPages` | `number` | `2` | Pages to keep rendered above/below viewport (only when `virtual=true`). |
| `workerSrc` | `string` | _bundled_ | Override the PDF.js worker URL. Use in Electron / Nuxt module setups where the bundled URL cannot be resolved. |
| `page` | `number` | `1` | Controlled current page. Reactive — change it to scroll. |
| `pdfWidth` | `string` | `'100%'` | Page width. Number = pixels, string = any CSS length. |
| `rowGap` | `number` | `8` | Vertical gap (px) between pages. |
| `cMapUrl` | `string` | unpkg URL | Override for offline use or custom CDN. |
| `password` | `string` | — | For decrypting protected PDFs. |
| `httpHeaders` | `object` | — | Sent with `fetch` for `src` URLs. |
| `withCredentials` | `boolean` | `false` | Cross-site cookies/auth headers. |
| `useSystemFonts` | `boolean` | — | Forwarded to pdf.js. |
| `stopAtErrors` | `boolean` | `false` | Forwarded to pdf.js. |
| `disableFontFace` | `boolean` | — | Forwarded to pdf.js. |
| `disableRange` | `boolean` | `false` | Forwarded to pdf.js. |
| `disableStream` | `boolean` | `false` | Forwarded to pdf.js. |
| `disableAutoFetch` | `boolean` | `false` | Useful for very large PDFs over CDNs — see `large-pdfs.md`. |
| `showProgress` | `boolean` | `true` | Top loading bar. |
| `progressColor` | `string` | `'#87ceeb'` | Default loading bar color. |
| `showPageTooltip` | `boolean` | `true` | "1/10" tooltip while scrolling. |
| `showBackToTopBtn` | `boolean` | `true` | Floating back-to-top button. |
| `scrollThreshold` | `number` | `300` | Scroll distance before the back-to-top button appears. |

## Events

| Event | Payload | When |
|---|---|---|
| `onProgress` | `(loadRatio: number)` | Download progress 0–100. |
| `onComplete` | `()` | Download finished (parsing may still be in progress). |
| `onScroll` | `(scrollOffset: number)` | Scroller `scrollTop`. |
| `onPageChange` | `(page: number)` | Current page changed (1-indexed). |
| `onPdfInit` | `(pdf: PDFDocumentProxy)` | PDF parsed, total pages known. Use this to read metadata / outline. |
| `onError` | `(error: Error)` | Load or render failure (introduced in v2.0.0). |

## Slots

| Slot | Bindings | Use for |
|---|---|---|
| `progress` | `{ loadRatio: number }` | Replace the default top progress bar. |
| `pageTooltip` | `{ currentPage: number, totalPages: number }` | Replace the "1/10" pill. |
| `backToTopBtn` | `{ scrollOffset: number }` | Replace the floating up-arrow button. |
| `pagePlaceholder` | `{ page: number, width: number, height: number }` | Skeleton for not-yet-rendered pages in virtual mode (v2.0.0+). |

## Exposed methods (via template `ref`)

```vue
<script setup>
import { ref } from 'vue'
import PDF from 'pdf-vue3'
const pdfRef = ref(null)

const print = () => pdfRef.value.print()
const download = () => pdfRef.value.download('my-file.pdf')
const goTo10 = () => pdfRef.value.goToPage(10)
const reload = () => pdfRef.value.reload()
const destroy = () => pdfRef.value.destroy()
</script>

<template>
  <PDF ref="pdfRef" src="/file.pdf" />
</template>
```

| Method | Signature | Notes |
|---|---|---|
| `reload` | `() => void` | Re-measure and re-layout. Useful when the container resized while the window did not. |
| `goToPage` | `(page: number) => void` | Scrolls to a 1-indexed page. Clamps to total pages. |
| `getPdf` | `() => PDFDocumentProxy \| null` | The underlying pdf.js document (null before load). Use for metadata, outline, text content. |
| `getTotalPages` | `() => number` | 0 until loaded. |
| `getCurrentPage` | `() => number` | 1-indexed. |
| `print` | `() => Promise<void>` | Prints via a hidden iframe. Mobile browsers may not support `window.print()` inside iframes. |
| `download` | `(filename?: string) => Promise<void>` | Downloads the original bytes (not a re-encoded PDF). |
| `destroy` | `() => void` | Frees the PDFDocument / pages / canvases. Calling code can then change `src` to reload. |

## Recipes

### Zoom

```vue
<script setup>
import { ref } from 'vue'
import PDF from 'pdf-vue3'
const scale = ref(1)
</script>

<template>
  <PDF src="/file.pdf" :scale="scale" />
  <button @click="scale = scale + 0.25">+</button>
  <button @click="scale = Math.max(0.25, scale - 0.25)">-</button>
</template>
```

> Do **not** use `transform: scale()` for zoom — it makes the canvas blurry. The `scale` prop triggers a real re-render at the new resolution.

### Controlled page navigation

```vue
<script setup>
import { ref } from 'vue'
import PDF from 'pdf-vue3'
const page = ref(1)
</script>

<template>
  <PDF src="/file.pdf" :page="page" @on-page-change="p => (page = p)" />
  <input type="number" v-model.number="page" min="1" />
</template>
```

### Custom progress bar

```vue
<PDF src="/file.pdf">
  <template #progress="{ loadRatio }">
    <div class="bar" :style="{ width: loadRatio + '%' }" />
  </template>
</PDF>
```

### Reading PDF metadata

```vue
<script setup>
import PDF from 'pdf-vue3'

const onInit = async (pdf) => {
  const meta = await pdf.getMetadata()
  console.log(meta.info)
  const outline = await pdf.getOutline()
  console.log(outline)
}
</script>

<template>
  <PDF src="/file.pdf" @on-pdf-init="onInit" />
</template>
```

### Error handling

```vue
<PDF
  src="/file.pdf"
  @on-error="(e) => toast.error('Failed to load: ' + e.message)"
/>
```
