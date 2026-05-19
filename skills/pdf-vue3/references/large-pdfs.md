# pdf-vue3 — Tuning for very large PDFs

> Read this when the user mentions large/multi-thousand-page PDFs, slow rendering, browser crashes on mobile, iOS Safari cut-off, or 200 MB+ files.

## Default behavior (v2.0.0+)

- `virtual: true` — only pages near the viewport are kept on the GPU.
- `preloadPages: 2` — keep 2 pages above and 2 below the viewport rendered.
- Pages outside `preloadPages + 2` are released: their canvas `width` /
  `height` are set to `0`, freeing the GPU memory.
- Render tasks are cancelled when the user scrolls past a page before its
  rendering finished.

This means thousand-page PDFs work without freezing the tab. **Do not turn
this off unless the user has a very specific reason.**

## Knobs

| Prop | Default | When to change it |
|---|---|---|
| `virtual` | `true` | Set `false` only if the user wants the whole document in DOM (e.g. needs to `Ctrl+F` against rendered canvases via a third-party tool that doesn't understand virtual scrolling). |
| `preloadPages` | `2` | Lower (e.g. `1`) for very low-RAM mobile devices, higher (e.g. `5`) on desktop for smoother fast-scroll. |
| `disableAutoFetch` | `false` | Set `true` for very large PDFs hosted on a CDN. Combined with the default `disableStream: false`, pdfjs will only fetch the byte ranges it needs to render visible pages. |
| `disableStream` | `false` | Leave at default unless your server doesn't support range requests. |
| `scale` | `1` | See "Scale trade-offs" below. |
| `cMapUrl` | unpkg | Host the cmaps yourself for offline or strict-CSP deployments. |

## Range-loading large PDFs

```vue
<PDF
  src="https://cdn.example.com/huge.pdf"
  :disable-auto-fetch="true"
/>
```

Requirements on the server:

- Must support HTTP `Range` requests (`Accept-Ranges: bytes`).
- Must serve a correct `Content-Length` header.

With both in place, opening a 200 MB PDF will only download the small index
+ the pages the user scrolls to. The component will show progressive
updates via `@on-progress`.

## Scale trade-offs

Each rendered page allocates a canvas at:

```
width  = page.baseWidth  * fitScale * scale * devicePixelRatio
height = page.baseHeight * fitScale * scale * devicePixelRatio
```

- `fitScale` = the scale needed to fit `pdfWidth`.
- `scale` = the user's zoom prop.
- `devicePixelRatio` = 2 or 3 on most modern displays.

That means at `scale=2` on a Retina display you allocate ~16x the GPU memory
of `scale=1`. Mobile GPUs have a maximum texture size (~4096×4096 on iOS).
If users hit blank pages at high zoom on mobile, advise lowering `scale`,
or rendering at lower DPR by manually overriding `window.devicePixelRatio`
in a parent context (advanced).

## iOS Safari / WeChat browser cut-off

A long-standing pdf.js limitation: a single canvas over ~16 megapixels gets
truncated on iOS. With virtual scrolling enabled, each canvas is a single
page — well under the limit — so this issue is no longer triggered for
typical A4/Letter pages even at `scale=2`. If a user still hits it:

1. Confirm `virtual: true` (default).
2. Confirm `scale ≤ 2` on iOS.
3. As a last resort, render at a lower `pdfWidth` (e.g. `"600"` instead of
   `"100%"`) to shrink each page canvas.

## Mobile crashes (Android WebView)

When loading 100 MB+ PDFs in an Android WebView, the OOM killer may kill
the app. To mitigate:

- Keep `virtual: true` and `preloadPages: 1`.
- Set `disableAutoFetch: true` to avoid eager prefetch.
- Call `pdfRef.value.destroy()` when navigating away from the PDF screen so
  the document and worker are released before the next screen mounts.

## Profiling tips

- Use Chrome DevTools' Performance panel and look for `Render` tasks
  >100ms; if many pages are scheduled in parallel, lower `preloadPages`.
- Memory tab → "Allocation instrumentation on timeline" should show a
  saw-tooth pattern (allocate → release) as you scroll. A monotonically
  rising line means you found a leak — file an issue with reproduction.
