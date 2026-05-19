# Changelog

All notable changes to this project will be documented in this file.

## 2.0.0

This is a major rewrite of the rendering pipeline focused on **performance for
large PDFs** and **bug fixes from the issue tracker**. The public API stays
largely compatible — existing apps should keep working with at most a tiny
adjustment to default behavior.

### Added

- **Virtual scrolling** is now the default (`virtual: true`). Only pages near
  the viewport are kept on the GPU; pages outside the configurable
  `preloadPages` window are released, keeping memory bounded even for very
  large documents. Closes [#13](https://github.com/hymhub/pdf-vue3/issues/13)
  and [#6](https://github.com/hymhub/pdf-vue3/issues/6).
- **`scale` prop** for crisp zooming. Pages are re-rendered at the new
  resolution instead of being CSS-scaled, so text stays sharp at any factor.
  Addresses [#27](https://github.com/hymhub/pdf-vue3/issues/27),
  [#11](https://github.com/hymhub/pdf-vue3/issues/11),
  [#5](https://github.com/hymhub/pdf-vue3/issues/5).
- **`onError` event** for graceful failure handling. Closes
  [#14](https://github.com/hymhub/pdf-vue3/issues/14).
- **Imperative API exposed via template ref**:
  - `print()` — print the loaded PDF through a hidden iframe. Closes
    [#28](https://github.com/hymhub/pdf-vue3/issues/28).
  - `download(filename?)` — trigger a browser download of the raw PDF data.
  - `goToPage(page)` — programmatic page jump.
  - `getPdf()`, `getTotalPages()`, `getCurrentPage()` — query state.
  - `destroy()` — manually release the document.
- **`pagePlaceholder` slot** — customize what is shown for pages that have
  not been rendered yet (visible while you scroll past unrendered pages).
- **`preloadPages` prop** — how many pages above/below the viewport to keep
  rendered (default `2`).
- **`workerSrc` prop** — escape hatch for environments where the bundled
  worker URL cannot be resolved (Electron, custom Nuxt setups, etc.).
- **AI agent skill bundle** under `skills/pdf-vue3/`, discoverable by
  [`skill-indexer`](https://github.com/hymhub/skill-indexer). Consumers can
  run `npx skill-indexer install -t all` to install the skill into
  Cursor / Codex / Claude / Copilot / Amp / OpenCode / Goose.

### Fixed

- **`eval()` warning** during build is gone. Upgraded `pdfjs-dist` to
  `4.10.38` which no longer contains the offending `eval("require")(…)` call.
  Closes [#25](https://github.com/hymhub/pdf-vue3/issues/25) and
  [#30](https://github.com/hymhub/pdf-vue3/issues/30).
- **URL detection rewritten**. We no longer rely on `src.endsWith('.pdf')` —
  any string that looks like a URL (`http(s)://`, `blob:`, `file:`, `//host`,
  or a relative path) is treated as a URL. Only obvious base64 / `data:`
  payloads are decoded to bytes. Fixes:
  - [#29](https://github.com/hymhub/pdf-vue3/issues/29) — presigned URLs
    without `.pdf` extension.
  - [#22](https://github.com/hymhub/pdf-vue3/pull/22) — URLs with query
    strings such as `?token=…&t=…`.
  - [#19](https://github.com/hymhub/pdf-vue3/issues/19) and
    [#26](https://github.com/hymhub/pdf-vue3/issues/26) — uppercase `.PDF` /
    mixed-case `.Pdf` extensions.
- **Memory leak / leaked PDF.js workers**. `loadingTask`, the `PDFDocumentProxy`
  and individual `PDFPageProxy` objects are no longer wrapped in reactive
  refs. They are properly `destroy()`-ed / `cleanup()`-ed on unmount and on
  every `src` change. Closes
  [#18](https://github.com/hymhub/pdf-vue3/issues/18).
- **"Cannot read parentNode of undefined" on unmount**. The internal
  `isDestroyed` guard short-circuits every async branch so renders that
  resolve after unmount don't touch DOM. Closes
  [#16](https://github.com/hymhub/pdf-vue3/issues/16) and
  [#15](https://github.com/hymhub/pdf-vue3/issues/15).
- **Multiple `<PDF>` instances on the same page** now coexist. All per-doc
  state lives inside the component instance (no shared module-level mutable
  state). Closes [#23](https://github.com/hymhub/pdf-vue3/issues/23).
- **API vs Worker version mismatch**. The worker is loaded relative to the
  bundled `pdfjs-dist`, so it always matches the API. Closes
  [#10](https://github.com/hymhub/pdf-vue3/issues/10).
- **iOS mobile / WeChat browser cut-off** — virtual scrolling + lazy
  rendering avoids the large-canvas limits that caused the bottom of the
  document to be blank on Safari iOS. Helps [#6](https://github.com/hymhub/pdf-vue3/issues/6).
- **SSR safety**: no `window`/`document` access happens before
  `onBeforeMount`, allowing the component to be imported in Nuxt 3 / Vite
  SSR without crashing.

### Changed

- **`pdfjs-dist` is upgraded from `3.7.107` to `4.10.38`** (ESM build). This
  is the largest dependency bump and the source of most of the security &
  compatibility fixes. The bundled worker is `pdfjs-dist/legacy/build/pdf.worker.mjs`.
- **Default `cMapUrl`** is now `https://unpkg.com/pdfjs-dist@4.10.38/cmaps/`.
  Set your own if you need offline use.
- **DOM structure**: each page is now wrapped in an absolutely positioned
  `<div class="pdf-vue3-page">` that contains either a `<canvas>` or a
  placeholder. Selectors targeting `.pdf-vue3-canvas-container > canvas`
  should be updated to `.pdf-vue3-page canvas`.

### Breaking changes

- DOM selector change as described above.
- The default `virtual: true` behavior means consumers who grab every canvas
  manually need to opt out by setting `:virtual="false"`.
- Internally the `pdfjs-dist` import path moved from
  `pdfjs-dist/legacy/build/pdf.min.js` to
  `pdfjs-dist/legacy/build/pdf.mjs`. If you patched this path, please update.

## 1.0.12 and earlier

See git history.
