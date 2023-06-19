# pdf-vue3

## Install

```bash
  npm i pdf-vue3
```

## Usage

```vue
<script setup>
import PDF from "pdf-vue3";
import { pdfBase64 } from "./pdf.js";
</script>

<template>
  <div style="width: 100vw; height: 100vh;overflow-y: auto;">
    <PDF :src="pdfBase64" style="width: 100%;" />
  </div>
</template>
```