# pdf-vue3 — Migrating from 1.x to 2.0.0

> Read this when the user is on `pdf-vue3@1.x` and wants to upgrade, or asks "what changed in 2.0.0".

## Headlines

- ✅ Same component name (`PDF`), same import path, same primary props.
- ✅ Existing 1.x apps usually just work after `npm i pdf-vue3@^2`.
- ⚠️ Default rendering mode is now **virtual scrolling**. Opt out with `:virtual="false"` if needed.
- ⚠️ Internal `pdfjs-dist` upgraded from `3.7.107` → `4.10.38` (ESM). The `eval()` warning is gone.
- ⚠️ DOM structure for pages changed slightly.

## Breaking changes

### 1. `pdfjs-dist` is now an ESM-only package

If your bundler can load `.mjs` (Vite, Webpack 5, Rollup, Nuxt 3, esbuild)
— nothing to do.

If you patch `node_modules/pdf-vue3/dist/...` (please don't), the new dist
imports from `pdfjs-dist/legacy/build/pdf.mjs` instead of `…pdf.min.js`.

### 2. Virtual scrolling is on by default

Pages outside the viewport are no longer kept in the DOM as ready-to-paint
canvases. If you depend on that (rare — e.g. you crawled the DOM looking
for `<canvas>` elements), set:

```vue
<PDF src="..." :virtual="false" />
```

### 3. DOM selectors

| 1.x | 2.0.0 |
|---|---|
| `.pdf-vue3-canvas-container > canvas` | `.pdf-vue3-page canvas` |
| _(no per-page wrapper)_ | `<div class="pdf-vue3-page">` wraps every page |

Update any global CSS overrides accordingly.

### 4. `cMapUrl` default

Updated from `…pdfjs-dist@3.7.107/cmaps/` to `…pdfjs-dist@4.10.38/cmaps/`.

If you hosted CMaps locally, point `:cMapUrl` to the new version's CMaps
(or just keep using your local URL — that's fine).

## New features you may want

- **`scale` prop**: real-resolution zoom. Replace any CSS `transform: scale()` hacks.
- **`onError` event**: subscribe to be told when a load/render fails (e.g. broken URL, wrong password). Previously errors were only `console.error`'d.
- **Imperative `print()` / `download()` / `goToPage()`**: see `usage.md`.
- **`pagePlaceholder` slot**: customize the skeleton shown for pages waiting to be rendered (virtual mode).
- **`workerSrc` prop**: override the bundled worker URL for unusual hosts.

## Step-by-step upgrade

```bash
npm i pdf-vue3@^2
```

1. Run your app. Most things should still work.
2. If you see DOM-targeting CSS no longer applying, update selectors per the table above.
3. Replace any `transform: scale()` zoom logic with the new `:scale` prop.
4. Subscribe to `@on-error` for graceful failure handling.
5. If you call `pdfRef.value.reload()` from 1.x, that still works. You also get `print()`, `download()`, `goToPage()`, `destroy()`, `getPdf()`, `getTotalPages()`, `getCurrentPage()` for free.

## What was fixed in 2.0.0

If you were hitting one of these in 1.x, the upgrade fixes it:

| Issue | Status |
|---|---|
| #25 / #30 — `eval()` warning at build | Fixed (pdfjs upgrade). |
| #29 — Presigned URL without `.pdf` extension is misread as base64 | Fixed (URL detection rewritten). |
| #22 — URL with query string fails (`?token=…`) | Fixed (same). |
| #19 / #26 — Uppercase `.PDF` / `.Pdf` misread as base64 | Fixed. |
| #18 — Memory leak / leaked workers | Fixed (proper destroy on unmount). |
| #16 / #15 — "Cannot read parentNode of undefined" on unmount | Fixed (isDestroyed guard). |
| #14 — No way to listen to load failures | Fixed (`onError` event). |
| #13 / #6 — Large PDFs slow / mobile crashes / iOS cut-off | Fixed (virtual scrolling + per-page canvases). |
| #28 — No print API | Fixed (`print()` exposed). |
| #27 / #11 / #5 — Zoom is blurry | Fixed (`scale` prop re-renders). |
| #23 — Two `<PDF />` on the same page only render one | Fixed (no shared module state). |
| #10 — API vs Worker version mismatch | Fixed. |
