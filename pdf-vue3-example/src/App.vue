<script setup>
import { ref, watchEffect } from "vue";
import PDF from "pdf-vue3";

const isMobile = ref(false);

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
</script>

<template>
  <div style="width: 100%">
    <PDF
      :pdf-width="isMobile ? '100%' : '768'"
      :row-gap="isMobile ? 4 : 8"
      src="/mastering_javascript_design_patterns_fragment.pdf"
    >
    </PDF>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  ::v-deep(.pdf-vue3-backToTopBtn) {
    right: 32px !important;
  }
}
</style>
