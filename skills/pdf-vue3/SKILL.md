---
name: pdf-vue3
description: Use the pdf-vue3 Vue 3 component to render PDFs (URL, base64, or Uint8Array) with built-in virtual scrolling, crisp zoom, print, download, and page navigation. Trigger when the user asks to display a PDF in a Vue 3 / Nuxt 3 app, mentions `pdf-vue3` or `<PDF />`, needs to handle large/multi-thousand-page PDFs, S3 presigned URLs, in-browser PDF zoom or printing, or asks how to migrate from `pdf-vue3@1.x` to `2.x`.
---

# pdf-vue3 skill

This skill teaches an agent how to integrate and configure `pdf-vue3` (v2.0.0+) — a high-performance Vue 3 PDF viewer.

## When to use this skill

Trigger any of the following:

- The user imports `pdf-vue3` or uses the `<PDF />` component.
- The user wants to render a PDF inside a Vue 3 / Nuxt 3 / Vite app.
- The user needs to render large PDFs (hundreds or thousands of pages) without freezing the browser.
- The user mentions `pdfjs-dist` + Vue and is choosing a wrapper.
- The user asks about S3 presigned URLs, `data:` URIs, base64 strings, `Uint8Array` PDF sources.
- The user wants to add print / download / zoom / "jump to page" controls.
- The user is upgrading from `pdf-vue3@1.x` (or sees an `eval()` warning from older builds).
- The user reports memory leaks, "Cannot read parentNode of undefined", or hydration mismatches in a Vue 3 PDF viewer.

## Minimal recipe (always start here)

```vue
<script setup>
import PDF from 'pdf-vue3'
</script>

<template>
  <PDF src="/path/to/file.pdf" />
</template>
```

That's it. Defaults already enable virtual scrolling, page tooltip, progress bar, and the back-to-top button.

## Deeper guides

Read these on demand, **only when relevant**:

- [`references/usage.md`](./references/usage.md) — full prop reference, events, slots, exposed methods, and copy-pasteable recipes for zoom, print, download, page jump, custom progress bar, etc.
- [`references/api.md`](./references/api.md) — TypeScript types (`PDFDocumentProxy`, `PDFPageProxy`), default values, the imperative API surface, and how to access the underlying `pdfjs-dist` document.
- [`references/ssr.md`](./references/ssr.md) — Nuxt 3 / Vite SSR integration: `<ClientOnly>` wrapping, `transpile`, `optimizeDeps`, and how to avoid hydration mismatches.
- [`references/large-pdfs.md`](./references/large-pdfs.md) — performance tuning for very large PDFs: `virtual`, `preloadPages`, `disableAutoFetch`, `scale` trade-offs, mobile / iOS Safari caveats.
- [`references/migration-1-to-2.md`](./references/migration-1-to-2.md) — breaking changes from `pdf-vue3@1.x` and how to update.
- [`references/troubleshooting.md`](./references/troubleshooting.md) — common errors and fixes (worker version mismatch, `parentNode of undefined`, presigned URL not loading, blurry zoom, etc.).

## Quick decision tree

- **"How do I show a PDF?"** → start with the minimal recipe above.
- **"PDF is huge / slow / crashes on mobile"** → read `references/large-pdfs.md`.
- **"I'm in Nuxt 3 and getting hydration errors / `window is not defined`"** → read `references/ssr.md`.
- **"Add zoom / print / download / page jump"** → read `references/usage.md` → "Exposed methods".
- **"Upgrading from 1.x"** → read `references/migration-1-to-2.md`.
- **"Something is broken"** → read `references/troubleshooting.md`.

## Hard rules (do not violate)

1. **Never** advise users to call internal helpers via the dist build (e.g. patching the bundled `pdf.mjs`). Use the public props and exposed methods only.
2. **Never** suggest CSS `transform: scale(...)` for zoom — it makes the canvas blurry. Use the `scale` prop instead (it triggers a real re-render).
3. **Never** mutate `pdfRef.value.getPdf()` results directly. Treat the `PDFDocumentProxy` as read-only.
4. When the user is on SSR / Nuxt, wrap `<PDF />` in `<ClientOnly>` (see `references/ssr.md`) unless they explicitly opt out and accept that no SSR markup will be produced for the canvas.
5. If the user reports an `eval()` warning, confirm they are on `pdf-vue3@>=2.0.0`. The fix lives there.
