<script setup>
import { ref, watchEffect } from "vue";
import PDF from "pdf-vue3";

const isMobile = ref(false);
const page = ref(1);
const scale = ref(1);
const virtual = ref(true);
const pdfRef = ref(null);

const handlePageChange = (newPage) => {
  console.log(`new page: ${newPage}`);
  page.value = newPage;
};

const handleError = (err) => {
  console.error("PDF error:", err);
};

const resize = () => {
  isMobile.value = window.innerWidth < 768;
};

watchEffect(() => {
  resize();
  window.addEventListener("resize", resize);
  return () => {
    window.removeEventListener("resize", resize);
  };
});

/**
 *
 * @param {import('pdf-vue3').PDFDocumentProxy} pdf - The PDF document proxy object.
 * @returns {void}
 */
const handlePdfInit = (pdf) => {
  console.log("PDF init, total pages:", pdf.numPages);
};

const onPrint = () => pdfRef.value?.print();
const onDownload = () => pdfRef.value?.download("demo.pdf");
const onZoomIn = () => (scale.value = Math.min(scale.value + 0.25, 4));
const onZoomOut = () => (scale.value = Math.max(scale.value - 0.25, 0.25));
const onZoomReset = () => (scale.value = 1);
</script>

<template>
  <div style="width: 100%">
    <PDF
      ref="pdfRef"
      :page="page"
      :pdf-width="isMobile ? '100%' : '768'"
      :row-gap="isMobile ? 4 : 8"
      :scale="scale"
      :virtual="virtual"
      :preload-pages="2"
      src="/pdf-vue3/mastering_javascript_design_patterns_fragment.pdf"
      @on-pdf-init="handlePdfInit"
      @on-page-change="handlePageChange"
      @on-error="handleError"
    >
    </PDF>
    <div class="tool-bar">
      <div class="row">
        <label>Page</label>
        <input type="number" v-model.number="page" :min="1" />
      </div>
      <div class="row">
        <label>Scale</label>
        <button @click="onZoomOut">-</button>
        <span>{{ (scale * 100).toFixed(0) }}%</span>
        <button @click="onZoomIn">+</button>
        <button @click="onZoomReset">1:1</button>
      </div>
      <div class="row">
        <label>
          <input type="checkbox" v-model="virtual" />
          Virtual scroll
        </label>
      </div>
      <div class="row">
        <button @click="onPrint">Print</button>
        <button @click="onDownload">Download</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  ::v-deep(.pdf-vue3-backToTopBtn) {
    right: 32px !important;
  }
}

.tool-bar {
  position: fixed;
  left: 16px;
  bottom: 16px;
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0px 0px 4px #777;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.tool-bar .row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-bar label {
  min-width: 50px;
}

.tool-bar input[type="number"] {
  width: 60px;
}

.tool-bar button {
  padding: 2px 8px;
  cursor: pointer;
}
</style>
