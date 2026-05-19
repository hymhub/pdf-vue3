<script setup lang="ts">
import { ref, onBeforeMount, onUnmounted } from "vue";

const PDF = defineAsyncComponent(() => import("pdf-vue3"));

const isMobile = ref(false);
const page = ref(1);
const scale = ref(1);
const virtual = ref(true);
const pdfRef = ref<any>(null);

const resize = () => {
  if (typeof window === "undefined") return;
  isMobile.value = window.innerWidth < 768;
};

onBeforeMount(() => {
  resize();
  window.addEventListener("resize", resize);
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", resize);
  }
});

const handleError = (err: Error) => {
  console.error("PDF error:", err);
};

const onPrint = () => pdfRef.value?.print();
const onDownload = () => pdfRef.value?.download("demo.pdf");
const onZoomIn = () => (scale.value = Math.min(scale.value + 0.25, 4));
const onZoomOut = () => (scale.value = Math.max(scale.value - 0.25, 0.25));
const onZoomReset = () => (scale.value = 1);
</script>

<template>
  <div style="width: 100%">
    <!--
      ClientOnly is the recommended way to mount pdf-vue3 inside Nuxt 3.
      The component is SSR-safe (no window/document access before
      onBeforeMount), but rendering a canvas on the server has no value, so we
      skip the SSR pass entirely and show a small placeholder fallback.
    -->
    <ClientOnly>
      <PDF
        ref="pdfRef"
        :page="page"
        :pdf-width="isMobile ? '100%' : '768'"
        :row-gap="isMobile ? 4 : 8"
        :scale="scale"
        :virtual="virtual"
        :preload-pages="2"
        src="/mastering_javascript_design_patterns_fragment.pdf"
        @on-page-change="(p: number) => (page = p)"
        @on-error="handleError"
      />
      <template #fallback>
        <div class="pdf-ssr-fallback">Loading PDF viewer…</div>
      </template>
    </ClientOnly>

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
.pdf-ssr-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #666;
  font-size: 14px;
}

@media (min-width: 768px) {
  :deep(.pdf-vue3-backToTopBtn) {
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
