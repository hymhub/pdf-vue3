# pdf-vue3

[English](./README.md) ｜ [中文](./README_ZH.md)

一个高性能 Vue 3 PDF 查看器，自带虚拟滚动、清晰缩放和极简 API。

在线演示: <https://hymhub.github.io/pdf-vue3/>

<img src="./pdf-vue3-demo.gif" style="width: 375px;" />

## 亮点

- **虚拟滚动**：只渲染可视区域内的页面，千页 PDF 也能流畅打开。
- **清晰缩放**：通过真实重绘（而不是 CSS `transform`）实现缩放，任意倍率都不糊。
- **更智能的 URL 识别**：兼容带查询参数的 URL、S3 预签名 URL、大写扩展名 `.PDF`、`data:` URI、base64、`Uint8Array`。
- **安全的生命周期**：组件卸载时正确销毁 `loadingTask` 和页面对象，不再出现 "Cannot read parentNode of undefined" 或内存泄漏。
- **新增 `onError` 事件**：失败可以被优雅捕获。
- **更多命令式 API**：`print()`、`download()`、`goToPage()`、`reload()`、`destroy()`、`getPdf()`...
- **无 `eval()`**：基于 `pdfjs-dist@4.10.38`，兼容严格 CSP 与现代打包器。
- **SSR 安全**（Nuxt 等）：所有依赖浏览器的代码都在 `onBeforeMount` 中执行。

## 安装

```bash
  npm i pdf-vue3
```

> v2.0.0+ 要求 Vue ^3.2 及一个支持 `.mjs` 的打包工具（Vite、Webpack 5、Rollup 等）。

## 使用

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

### 实用示例：大 PDF + 缩放 + 打印

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
  <button @click="scale = scale + 0.25">放大</button>
  <button @click="pdfRef.print()">打印</button>
  <button @click="pdfRef.download('huge.pdf')">下载</button>
  <button @click="pdfRef.goToPage(100)">跳到第 100 页</button>
</template>
```

## 配置 API

### `组件参数(Props)`

|      属性     | 描述 |                 类型                 |
| :----------------: | :---------- | :----------------------------------: |
|       `src`        | PDF 的 URL 或二进制数据（Uint8Array）或 BASE64 编码。v2.0.0 起会正确处理带查询参数的 URL、大写扩展名、S3 预签名 URL 和 `data:` URI。 | `string` \| `Uint8Array` \| `BASE64` |
|       `scale`      | 缩放倍率（1 = 100%）。页面会按新分辨率重绘以保持清晰。默认 `1`。 | `number` |
|      `virtual`     | 是否启用虚拟列表，只渲染视口附近的页面。默认 `true`。 | `boolean` |
|   `preloadPages`   | 启用虚拟列表时，视口上下额外预渲染的页数。默认 `2`。 | `number` |
|     `workerSrc`    | 自定义 PDF.js worker URL，在打包器无法解析默认 worker 路径时使用。 | `string` |
|   `showProgress`   | 是否显示下载进度条。默认 `true`。 |              `boolean`               |
|  `progressColor`   | 下载进度条颜色。默认 `#87ceeb`。 |               `string`               |
| `showPageTooltip`  | 是否显示分页提示。默认 `true`。 |              `boolean`               |
| `showBackToTopBtn` | 是否显示回顶部按钮。默认 `true`。 |              `boolean`               |
| `scrollThreshold`  | 滚动距离超过多少显示返回顶部的按钮。默认 `300`。 |               `number`               |
|     `pdfWidth`     | PDF 页面宽度。默认 `100%`。 |               `string`               |
|      `rowGap`      | PDF 页面之间的行距。默认 `8`。 |               `number`               |
|       `page`       | 受控的当前页码，支持响应式变量动态跳转。默认 `1`。 | `number` |
|       `cMapUrl`    | 自定义 cMapUrl。默认 `https://unpkg.com/pdfjs-dist@4.10.38/cmaps/`。 | `string` |
|   `httpHeaders`    | 设置 httpHeaders 信息。 |               `object`               |
| `withCredentials`  | 是否使用 cookies/授权头进行跨站请求。默认 `false`。 |              `boolean`               |
|     `password`     | 用于解密受密码保护的 PDF。 |               `string`               |
|  `useSystemFonts`  | 当 `true` 时，未嵌入到 PDF 的字体将回退到系统字体。 |              `boolean`               |
|   `stopAtErrors`   | 解析失败时直接拒绝相关 Promise，默认 `false`。 |              `boolean`               |
| `disableFontFace`  | 禁用 `@font-face`，使用 PDF.js 内置字体渲染器。 |              `boolean`               |
|   `disableRange`   | 禁用 PDF 范围请求加载。默认 `false`。 |              `boolean`               |
|  `disableStream`   | 禁用 PDF 数据流加载。默认 `false`。 |              `boolean`               |
| `disableAutoFetch` | 禁用 PDF 数据预取。默认 `false`。 |              `boolean`               |

### `事件(Events)`

|     事件名      | 描述 |                 参数                 |
| :----------------: | :---------- | :----------------------------------: |
|       `onProgress`        | 监听 PDF 下载进度，参数为 `0-100`。 | `loadRatio: number` |
|       `onComplete`        | PDF 下载完成。 | `-` |
|       `onScroll`        | 监听 PDF 滚动，参数是当前 `scrollTop` 值。 | `scrollOffset: number` |
|       `onPageChange`    | 监听页码改变。 | `page: number` |
|       `onPdfInit`       | 监听 PDF 初始化。PDFDocumentProxy: <https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html> | `pdf: PDFDocumentProxy` |
|       `onError`         | **v2 新增** — 加载或渲染失败时触发。 | `error: Error` |

### `插槽(Slots)`

|     插槽名      | 描述 |                 参数                 |
| :----------------: | :---------- | :----------------------------------: |
|       `progress`        | 自定义进度条。 | `loadRatio: number` |
|       `pageTooltip`     | 自定义分页提示。 | `currentPage: number, totalPages: number` |
|       `backToTopBtn`    | 自定义回顶部按钮。 | `scrollOffset: number` |
|     `pagePlaceholder`   | **v2 新增** — 虚拟列表中尚未渲染页面的占位内容。 | `page: number, width: number, height: number` |

### `暴露方法（通过 ref 调用）`

|     方法      | 描述 |                 签名                 |
| :----------------: | :---------- | :----------------------------------: |
| `reload`         | 当容器尺寸变了但窗口没变时，可调用以重新布局。 | `() => void` |
| `goToPage`       | 跳转到指定页码。 | `(page: number) => void` |
| `getPdf`         | 获取底层 `PDFDocumentProxy`，未加载时为 `null`。 | `() => PDFDocumentProxy \| null` |
| `getTotalPages`  | 获取总页数。 | `() => number` |
| `getCurrentPage` | 获取当前页码。 | `() => number` |
| `print`          | 通过隐藏 iframe 打印当前 PDF。 | `() => Promise<void>` |
| `download`       | 触发浏览器下载原始 PDF 数据。 | `(filename?: string) => Promise<void>` |
| `destroy`        | 手动销毁文档释放内存。 | `() => void` |

## 大 PDF 性能建议

- 保持 `virtual` 开启（默认）。视图只会渲染视口附近的页面，远离视口的 canvas 会被释放，内存稳定。
- 服务于 CDN 的超大 PDF 可结合 `disableAutoFetch: true` 与默认的范围请求，PDF.js 只会取它真正需要的字节。
- 不要把 `scale` 调到极端值（比如 `>4`）。每个 canvas 会按 `scale * devicePixelRatio` 分配像素缓冲区，移动端 GPU 可能不支持过大的纹理。
- 在 Electron、Nuxt 模块、Webpack 5 等场景下若无法解析默认 worker，请显式传入 `workerSrc`。

## 从 1.x 升级

v2.0.0 大体保持向后兼容，原有 props 继续可用。主要变化：

- **默认开启虚拟滚动**。如果你的代码依赖每个 canvas 都常驻 DOM，请显式设置 `:virtual="false"`。
- 内置 `pdfjs-dist` 升级到 **4.10.38**，修复 #25 / #30 的 `eval()` 安全告警，以及 #10 的 API 与 Worker 版本不匹配。
- 新增 **`onError`** 事件，建议订阅以处理错误链接、密码错误等场景。
- DOM 结构略有变化：每页现在包裹在一个绝对定位的 `<div class="pdf-vue3-page">` 内，里面是 `<canvas>` 或占位元素。原本针对 `.pdf-vue3-canvas-container > canvas` 的样式请改为 `.pdf-vue3-page canvas`。

## AI Agent Skill

本包已附带 [SKILL.md](./skills/pdf-vue3/SKILL.md)，用于教 AI 编程助手
（Claude、Cursor、Codex、Copilot、Amp、OpenCode、Goose）正确集成 `pdf-vue3`。

如果你使用其中之一并安装了
[`skill-indexer`](https://github.com/hymhub/skill-indexer)，运行：

```bash
npx skill-indexer install -t all
```

skill 及其 SSR、大 PDF、迁移、排错等详情文档会从你的 `node_modules` 自动发现并安装到对应工具的 skills 目录下。

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)。
