<script setup>
import { ref, watchEffect } from "vue";
import PDF from "pdf-vue3";

const isMobile = ref(false);
const page = ref(1);

const handlePageChange = (newPage) => {
  console.log(`new page: ${newPage}`);
  page.value = newPage;
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
  console.log(pdf);
};
</script>

<template>
  <div style="width: 100%">
    <PDF
      :page="page"
      :pdf-width="isMobile ? '100%' : '768'"
      :row-gap="isMobile ? 4 : 8"
      src="/pdf-vue3/mastering_javascript_design_patterns_fragment.pdf"
      @on-pdf-init="handlePdfInit"
      @on-page-change="handlePageChange"
    >
    </PDF>
    <div class="tool-bar">
      <p>Enter page number</p>
      <input type="number" v-model="page" />
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
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0px 0px 2px #777;
  border-radius: 4px;
  line-height: 1em;
  padding: 8px;
}

.tool-bar > p {
  margin: 0 0 8px;
}
</style>
