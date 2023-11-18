# pdf-vue3

[English](./README.md) ｜ [中文](./README_ZH.md)

vue3 pdf viewer

example: <https://hymhub.github.io/pdf-vue3/>

<img src="./pdf-vue3-demo.gif" style="width: 375px;" />

## Install

```bash
  npm i pdf-vue3
```

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

## Config API

### `Props`

|     Attribute      | Description |                 Type                 |
| :----------------: | :---------- | :----------------------------------: |
|       `src`        | The URL or binary data(Uint8Array) or BASE64-encoded of the PDF. | `string` \| `Uint8Array` \| `BASE64` |
|   `showProgress`   | Whether to download the progress bar. The default value is `true`. |              `boolean`               |
|  `progressColor`   | Download progress bar color. The default value is `#87ceeb`. |               `string`               |
| `showPageTooltip`  | Whether to show page tooltips. The default value is `true`. |              `boolean`               |
| `showBackToTopBtn` | Whether to show back to the top button. The default value is `true`. |              `boolean`               |
| `scrollThreshold`  | Scrolling distance over how much to display the back to top button. The default value is `300`. |               `number`               |
|     `pdfWidth`     | pdf page width. The default value is `100%`. |               `string`               |
|      `rowGap`      | Line spacing between pdf pages. The default value is `8`. |               `number`               |
|       `page`       | Controls the current page number, and supports responsive variables to dynamically change the page number. The default value is `1` | `number` |
|   `httpHeaders`    | Basic authentication headers. |               `object`               |
| `withCredentials`  | Indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies or authorization headers. The default is `false`. |              `boolean`               |
|     `password`     | For decrypting password-protected PDFs. |               `string`               |
|  `useSystemFonts`  | When `true`, fonts that aren't embedded in the PDF document will fallback to a system font. The default value is `true` in web environments and `false` in Node.js; unless `disableFontFace === true` in which case this defaults to `false` regardless of the environment (to prevent completely broken fonts). |              `boolean`               |
|   `stopAtErrors`   | Reject certain promises, e.g. `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated PDF data cannot be successfully parsed, instead of attempting to recover whatever possible of the data. The default value is `false`. |              `boolean`               |
| `disableFontFace`  | By default fonts are converted to OpenType fonts and loaded via the Font Loading API or `@font-face` rules. If disabled, fonts will be rendered using a built-in font renderer that constructs the glyphs with primitive path commands. The default value is `false` in web environments and `true` in Node.js. |              `boolean`               |
|   `disableRange`   | Disable range request loading of PDF files. When enabled, and if the server supports partial content requests, then the PDF will be fetched in chunks. The default value is `false`. |              `boolean`               |
|  `disableStream`   | Disable streaming of PDF file data. By default PDF.js attempts to load PDF files in chunks. The default value is `false`. |              `boolean`               |
| `disableAutoFetch` | Disable pre-fetching of PDF file data. When range requests are enabled PDF.js will automatically keep fetching more data even if it isn't needed to display the current page. The default value is `false`. NOTE: It is also necessary to disable streaming, see above, in order for disabling of pre-fetching to work correctly. |              `boolean`               |

### `Events`

|     Event Name      | Description |                 Parameters                 |
| :----------------: | :---------- | :----------------------------------: |
|       `onProgress`        | listen to the pdf download progress, the parameters for `0-100`. | `loadRatio: number` |
|       `onComplete`        | pdf download complete. | `-` |
|       `onScroll`        | Listen to the pdf scrolling, the parameter is the current `scrollTop` value. | `scrollOffset: number` |
|       `onPageChange`    | Listen for page number changes. | `page: number` |
|       `onRendered`    | pdf is rendered. | `totalPages: number` |

### `Slots`

|     Slot Name      | Description |                 Parameters                 |
| :----------------: | :---------- | :----------------------------------: |
|       `progress`        | Customized progress bar | `loadRatio: number` |
|       `pageTooltip`        | Customized page tooltips | `currentPage: number, totalPages: number` |
|       `backToTopBtn`        | Customize the Back to Top button | `scrollOffset: number` |
