<script setup>
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.min.js";
import { ref, onMounted, onUnmounted } from "vue";
const workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).href

GlobalWorkerOptions.workerSrc = workerSrc;
const dpr = window.devicePixelRatio || 1;
const { src } = defineProps({
  src: String
});

// base64 就是后端返回的 base64 字符串，例如: data:image/jpeg;base64,JVBERi0xLjQKJe...
const binaryData = atob(src.split(",")[1]);

// base64 解码 byteArray
const byteArray = new Uint8Array(binaryData.length);
for (let i = 0; i < binaryData.length; i++) {
  byteArray[i] = binaryData.charCodeAt(i);
}

// pdfjs 能直接读取 byteArray
const loadingTask = getDocument(byteArray);

// pdf 总页数
const numPages = ref(0);

// pdf 解析后的实例对象
let pdf;
// 渲染 pdf
const renderPDF = async () => {
  try {
    // 解析 pdf 单例模式防止重复解析
    if (!pdf) {
      pdf = await loadingTask.promise;
      numPages.value = pdf.numPages;
    }
  } catch (error) {
    console.error("Error loadingTask PDF:", error);
  }

  for (let i = 0; i < numPages.value; i++) {
    try {
      const page = await pdf.getPage(i + 1);
      // 用父盒子宽度计算 pdf 渲染的 scale 实现矢量缩放
      const canvas = document.getElementById(`pdfCanvas${i + 1}`);
      var viewport = page.getViewport({ scale: 1 });
      var scale = canvas.parentNode.offsetWidth / viewport.width;
      // 开始正式渲染
      const context = canvas.getContext("2d");
      const scaledViewport = page.getViewport({ scale: scale * dpr });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
    } catch (error) {
      console.error("Error rendering PDF:", error);
    }
  }
};

// 防抖
let timer;
const renderPDFWithDebounce = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    renderPDF();
  }, 300);
};

// 监听页面大小变化重新渲染
onMounted(() => {
  renderPDF();
  window.addEventListener("resize", renderPDFWithDebounce);
});

onUnmounted(() => {
  clearTimeout(timer);
  window.removeEventListener("resize", renderPDFWithDebounce);
});
</script>

<template>
  <div>
    <canvas style="display: block;width: 100% !important;" v-for="item in numPages" :key="item"
      :id="`pdfCanvas${item}`"></canvas>
  </div>
</template>

<style scoped></style>
