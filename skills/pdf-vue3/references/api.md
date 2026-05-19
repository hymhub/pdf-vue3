# pdf-vue3 — API reference

> Read this when the user asks about TypeScript types, the imperative API surface, or wants to access pdfjs internals through the component.

## TypeScript types

```ts
import PDF, {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdf-vue3'
```

| Export | Description |
|---|---|
| `PDF` (default) | The Vue 3 component. |
| `PDFDocumentProxy` | Re-exported pdf.js document type (subset; index signature for the rest). |
| `PDFPageProxy` | Re-exported pdf.js page type (subset; index signature for the rest). |

Both types intentionally use `[key: string]: any` so any future pdf.js method is still callable — but consumers should rely only on the documented members.

## Default values (from `withDefaults`)

```ts
{
  showProgress: true,
  progressColor: '#87ceeb',
  showPageTooltip: true,
  showBackToTopBtn: true,
  scrollThreshold: 300,
  pdfWidth: '100%',
  rowGap: 8,
  page: 1,
  cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
  scale: 1,
  virtual: true,
  preloadPages: 2,
  workerSrc: undefined,
  // ...all other props default to undefined and are stripped before
  // being forwarded to pdfjs `getDocument`.
}
```

## Imperative API (exposed via template ref)

```ts
interface PdfVue3Instance {
  reload(): void
  goToPage(page: number): void
  getPdf(): PDFDocumentProxy | null
  getTotalPages(): number
  getCurrentPage(): number
  print(): Promise<void>
  download(filename?: string): Promise<void>
  destroy(): void
}
```

### Accessing the underlying pdf.js document

`getPdf()` returns the live `PDFDocumentProxy` (or `null` if the component has not finished loading yet).

```ts
const pdf = pdfRef.value?.getPdf()
if (pdf) {
  const page1: PDFPageProxy = await pdf.getPage(1)
  const textContent = await page1.getTextContent()
  // ... do something with text items
}
```

> Do **not** call `pdf.destroy()` directly — use the component's `destroy()` instead so internal bookkeeping stays consistent.

### Print

```ts
await pdfRef.value.print()
```

Implementation detail: a hidden `<iframe>` is mounted with a blob URL of the
PDF data, then `iframe.contentWindow.print()` is called. The iframe is
removed automatically after 60s.

Mobile Safari may block `window.print()` inside iframes. If that's a
constraint, recommend `download()` instead.

### Download

```ts
await pdfRef.value.download('quarterly-report.pdf')
```

Triggers a browser-side download using a temporary blob URL. The bytes are
exactly what was loaded (not re-encoded).

### Destroy

```ts
pdfRef.value.destroy()
```

Tears down the `PDFDocument`, releases page references, and clears canvases.
A subsequent `src` change will rebuild from scratch.

## Component event signatures

```ts
type Emits = {
  (e: 'onProgress', loadRatio: number): void
  (e: 'onComplete'): void
  (e: 'onScroll', scrollOffset: number): void
  (e: 'onPageChange', page: number): void
  (e: 'onPdfInit', pdf: PDFDocumentProxy): void
  (e: 'onError', error: Error): void
}
```

Note that Vue 3 maps the listener names to kebab-case in templates:
`@on-progress`, `@on-page-change`, `@on-pdf-init`, `@on-error`, etc.

## Slot signatures

```ts
type Slots = {
  progress?: (props: { loadRatio: number }) => any
  pageTooltip?: (props: { currentPage: number; totalPages: number }) => any
  backToTopBtn?: (props: { scrollOffset: number }) => any
  pagePlaceholder?: (props: {
    page: number
    width: number
    height: number
  }) => any
}
```

## DOM contract

Each page is rendered as:

```html
<div class="pdf-vue3-page" style="position: absolute; top: …px;">
  <canvas class="pdf-vue3-canvas" /> <!-- or pagePlaceholder slot -->
</div>
```

Wrapped in:

```html
<div class="pdf-vue3-canvas-container" style="position: relative; height: …;">
  <!-- pages here -->
</div>
```

When styling, prefer `.pdf-vue3-page canvas` over the legacy
`.pdf-vue3-canvas-container > canvas` selector that worked in v1.x.
