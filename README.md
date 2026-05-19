# pdf-vue3

[English](./README.md) ｜ [中文](./README_ZH.md)

A high-performance Vue 3 PDF viewer with virtual scrolling, smooth zooming, and a tiny API.

example: <https://hymhub.github.io/pdf-vue3/>

<img src="./pdf-vue3-demo.gif" style="width: 375px;" />

## Highlights

- **Virtual scrolling** out of the box, render only what is in the viewport. Open thousand-page PDFs without freezing.
- **Crisp zoom** via real re-rendering (not CSS `transform`), so text stays sharp at any scale.
- **Smarter URL handling** — works with query parameters, S3 presigned URLs, uppercase `.PDF` extensions, `data:` URIs, base64 and `Uint8Array`.
- **Safe lifecycle** — proper cleanup of `loadingTask` / pages on unmount, no more "Cannot read parentNode of undefined" or memory leaks.
- **`onError` event** to gracefully handle failures.
- **Imperative API**: `print()`, `download()`, `goToPage()`, `reload()`, `destroy()`, `getPdf()`...
- **No `eval()`** — built on `pdfjs-dist@4.10.38`, friendly to strict CSPs and modern bundlers.
- **SSR safe** (Nuxt, etc.) — all browser-only code lives behind `onBeforeMount`.

## Install

```bash
  npm i pdf-vue3
```

> v2.0.0+ requires Vue ^3.2 and a bundler that can load `.mjs` (Vite, Webpack 5, Rollup, etc.).

## Usage

```vue
<script setup>
import PDF from "pdf-vue3";
</script>

<template>
  <PDF src="/demo.pdf" />
  <!-- <PDF :src="BASE64" /> -->
  <!-- <PDF :src="Uint8Array" /> -->
</template>
```

### Quick recipe: large PDF + zoom + print

```vue
<script setup>
import { ref } from "vue";
import PDF from "pdf-vue3";

const pdfRef = ref(null);
const scale = ref(1);
const page = ref(1);
</script>

<template>
  <PDF
    ref="pdfRef"
    src="/huge.pdf"
    :scale="scale"
    :page="page"
    :preload-pages="2"
    @on-error="(e) => console.error(e)"
  />
  <button @click="scale = scale + 0.25">Zoom in</button>
  <button @click="pdfRef.print()">Print</button>
  <button @click="pdfRef.download('huge.pdf')">Download</button>
  <button @click="pdfRef.goToPage(100)">Jump to page 100</button>
</template>
```

## Config API

### `Props`

|     Attribute      | Description |                 Type                 |
| :----------------: | :---------- | :----------------------------------: |
|       `src`        | The URL or binary data(Uint8Array) or BASE64-encoded of the PDF. URL detection now correctly handles query parameters, uppercase extensions, S3 presigned URLs, and `data:` URIs. | `string` \| `Uint8Array` \| `BASE64` |
|       `scale`      | Zoom factor (1 = 100%). Pages are re-rendered at the new resolution to stay sharp. Default `1`. | `number` |
|      `virtual`     | Enable virtualized rendering — only pages near the viewport are kept on the GPU. Default `true`. | `boolean` |
|   `preloadPages`   | Number of pages to keep rendered above & below the viewport (when `virtual` is enabled). Default `2`. | `number` |
|     `workerSrc`    | Override the PDF.js worker URL. Useful in environments where the bundled worker URL cannot be resolved. | `string` |
|   `showProgress`   | Whether to display the download progress bar. Default `true`. |              `boolean`               |
|  `progressColor`   | Download progress bar color. Default `#87ceeb`. |               `string`               |
| `showPageTooltip`  | Whether to show the page tooltip. Default `true`. |              `boolean`               |
| `showBackToTopBtn` | Whether to show the back-to-top button. Default `true`. |              `boolean`               |
| `scrollThreshold`  | Scrolling distance over which the back-to-top button appears. Default `300`. |               `number`               |
|     `pdfWidth`     | PDF page width. Default `100%`. |               `string`               |
|      `rowGap`      | Line spacing between pages. Default `8`. |               `number`               |
|       `page`       | Controlled current page number, supports reactive variables for jumping. Default `1`. | `number` |
|       `cMapUrl`    | Custom cMapUrl. Default `https://unpkg.com/pdfjs-dist@4.10.38/cmaps/`. | `string` |
|   `httpHeaders`    | Basic authentication headers. |               `object`               |
| `withCredentials`  | Whether cross-site Access-Control requests should include credentials such as cookies. Default `false`. |              `boolean`               |
|     `password`     | For decrypting password-protected PDFs. |               `string`               |
|  `useSystemFonts`  | When `true`, fonts that aren't embedded in the PDF document fall back to system fonts. |              `boolean`               |
|   `stopAtErrors`   | Reject certain promises when the associated PDF data cannot be successfully parsed. Default `false`. |              `boolean`               |
| `disableFontFace`  | Render fonts using PDF.js's built-in renderer instead of `@font-face`. |              `boolean`               |
|   `disableRange`   | Disable range request loading. Default `false`. |              `boolean`               |
|  `disableStream`   | Disable streaming of PDF file data. Default `false`. |              `boolean`               |
| `disableAutoFetch` | Disable pre-fetching of PDF data. Default `false`. |              `boolean`               |

### `Events`

|     Event Name      | Description |                 Parameters                 |
| :----------------: | :---------- | :----------------------------------: |
|       `onProgress`        | Listen to the pdf download progress. `0-100`. | `loadRatio: number` |
|       `onComplete`        | PDF download complete. | `-` |
|       `onScroll`        | Listen to the pdf scrolling, parameter is the current `scrollTop`. | `scrollOffset: number` |
|       `onPageChange`    | Listen for page number changes. | `page: number` |
|       `onPdfInit`       | PDF is initialized. PDFDocumentProxy: <https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html> | `pdf: PDFDocumentProxy` |
|       `onError`         | **New in v2** — fired when loading or rendering fails. | `error: Error` |

### `Slots`

|     Slot Name      | Description |                 Parameters                 |
| :----------------: | :---------- | :----------------------------------: |
|       `progress`        | Customized progress bar. | `loadRatio: number` |
|       `pageTooltip`     | Customized page tooltip. | `currentPage: number, totalPages: number` |
|       `backToTopBtn`    | Customized back-to-top button. | `scrollOffset: number` |
|     `pagePlaceholder`   | **New in v2** — placeholder shown for pages that have not been rendered yet (virtual scrolling). | `page: number, width: number, height: number` |

### `Exposed methods` (via template ref)

|     Method      | Description |                 Signature                 |
| :----------------: | :---------- | :----------------------------------: |
| `reload`         | Re-layout the viewer when the container resized while the window did not. | `() => void` |
| `goToPage`       | Programmatically scroll to a page. | `(page: number) => void` |
| `getPdf`         | Get the underlying `PDFDocumentProxy` (or `null` if not loaded). | `() => PDFDocumentProxy \| null` |
| `getTotalPages`  | Get the total number of pages. | `() => number` |
| `getCurrentPage` | Get the current page number. | `() => number` |
| `print`          | Print the loaded PDF through a hidden iframe. | `() => Promise<void>` |
| `download`       | Trigger a browser download of the original PDF data. | `(filename?: string) => Promise<void>` |
| `destroy`        | Manually destroy the loaded document and release memory. | `() => void` |

## Performance tips for large PDFs

- Keep `virtual` enabled (default). The viewer will only render the pages within the viewport plus `preloadPages` on each side, and release canvases that are far away.
- Use `disableAutoFetch: true` together with `disableStream: false` (the defaults for range loading) when serving very large PDFs from a CDN — PDF.js will only fetch the bytes it needs.
- Avoid setting `scale` to extreme values (e.g. `>4`); each canvas is allocated at `scale * devicePixelRatio` of its base width and can run into mobile GPU limits.
- Provide your own `workerSrc` when bundling with a non-standard layout (Electron, Nuxt module, Webpack 5, etc.).

## Migration from 1.x

v2.0.0 is mostly backward compatible. Existing props continue to work. Notable changes:

- **Default behavior is now virtual scrolling**. If you depend on every canvas existing in the DOM, set `:virtual="false"`.
- The internal `pdfjs-dist` is upgraded to **4.10.38**. This removes the `eval()` warning reported in #25 / #30 and the API-vs-Worker version mismatch (#10).
- **`onError`** event added — recommended to subscribe so you can react to broken URLs, passwords, etc.
- The DOM structure changed slightly: each page is now wrapped in an absolutely positioned `<div class="pdf-vue3-page">` containing either a `<canvas>` or a placeholder. Style overrides targeting `.pdf-vue3-canvas-container > canvas` should target `.pdf-vue3-page canvas` instead.

## AI agent skill

This package ships a [SKILL.md](./skills/pdf-vue3/SKILL.md) that teaches AI
coding agents (Claude, Cursor, Codex, Copilot, Amp, OpenCode, Goose) how to
integrate `pdf-vue3` correctly.

If you use one of those agents and have
[`skill-indexer`](https://github.com/hymhub/skill-indexer) installed, just
run:

```bash
npx skill-indexer install -t all
```

and the skill — along with detail docs for SSR, large PDFs, migration, and
troubleshooting — will be auto-discovered from your `node_modules` and
installed into the right per-agent folder.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
