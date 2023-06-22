<script setup lang="ts">
import {
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.min.js";
import { ref, onMounted, onUnmounted, Ref, computed } from "vue";
const workerSrc = new URL(
  "../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js",
  import.meta.url
).href;

GlobalWorkerOptions.workerSrc = workerSrc;
const dpr = ref(1);

const props = withDefaults(
  defineProps<{
    /**
     * pdf url | Uint8Array | BASE64
     */
    src: string | Uint8Array;
    httpHeaders?: Record<string, any>;
    withCredentials?: boolean;
    password?: string;
    useSystemFonts?: boolean;
    stopAtErrors?: boolean;
    disableFontFace?: boolean;
    disableRange?: boolean;
    disableStream?: boolean;
    disableAutoFetch?: boolean;
    // --custom--
    showProgress?: boolean;
    progressColor?: string;
    showPageTooltip?: boolean;
    showBackToTopBtn?: boolean;
    scrollThreshold?: number;
    pdfWidth?: string;
    rowGap?: number;
  }>(),
  {
    src: undefined,
    httpHeaders: undefined,
    withCredentials: undefined,
    password: undefined,
    useSystemFonts: undefined,
    stopAtErrors: undefined,
    disableFontFace: undefined,
    disableRange: undefined,
    disableStream: undefined,
    disableAutoFetch: undefined,
    showProgress: true,
    progressColor: "#87ceeb",
    showPageTooltip: true,
    showBackToTopBtn: true,
    scrollThreshold: 300,
    pdfWidth: "100%",
    rowGap: 8,
  }
);

const rowGap = computed(() => parseInt(String(props.rowGap)));

const emit = defineEmits<{
  (e: "onProgress", loadRatio: number): void;
  (e: "onComplete"): void;
  (e: "onScroll", scrollOffset: number): void;
}>();

const slots = defineSlots<{
  progress?: (props: { loadRatio: number }) => any;
  pageTooltip?: (props: { currentPage: number; totalPages: number }) => any;
  backToTopBtn?: (props: { scrollOffset: number }) => any;
}>();

const canvasRefs = ref<Array<Ref<Array<HTMLCanvasElement>>>>([]);

interface Option extends Record<string, any> {
  url?: string;
  data?: Uint8Array;
  httpHeaders?: Record<string, any>;
  withCredentials?: boolean;
  password?: string;
  useSystemFonts?: boolean;
  stopAtErrors?: boolean;
  disableFontFace?: boolean;
  disableRange?: boolean;
  disableStream?: boolean;
  disableAutoFetch?: boolean;
}

const option: Option = {
  httpHeaders: props.httpHeaders,
  withCredentials: props.withCredentials,
  password: props.password,
  useSystemFonts: props.useSystemFonts,
  stopAtErrors: props.stopAtErrors,
  disableFontFace: props.disableFontFace,
  disableRange: props.disableRange,
  disableStream: props.disableStream,
  disableAutoFetch: props.disableAutoFetch,
};

if (props.src instanceof Uint8Array) {
  option.data = props.src;
} else if (props.src.endsWith(".pdf")) {
  option.url = props.src;
} else {
  const binaryData = atob(
    props.src.includes(",") ? props.src.split(",")[1] : props.src
  );
  const byteArray = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    byteArray[i] = binaryData.charCodeAt(i);
  }
  option.data = byteArray;
}

for (const key in option) {
  if (option[key] === undefined) {
    delete option[key];
  }
}

const loadingTask = getDocument(option);

const loadRatio = ref(0);
loadingTask.onProgress = (progressData: any) => {
  const ratio = (progressData.loaded / progressData.total) * 100;
  loadRatio.value = ratio >= 100 ? 100 : ratio;
  emit("onProgress", loadRatio.value);
};
loadingTask.promise.then(() => {
  emit("onComplete");
});

const totalPages = ref(0);
const currentPage = ref(1);
const scrollOffset = ref(0);
const itemHeightList = ref<Array<number>>([]);

const scroller = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const container = ref<HTMLDivElement>() as Ref<HTMLDivElement>;

let pdf: any;
const cancelRendering = ref(false);
const renderComplete = ref(false);
const renderPDF = async () => {
  renderComplete.value = false;
  try {
    if (!pdf) {
      pdf = await loadingTask.promise;
      const refs = [];
      for (let i = 0; i < pdf.numPages; i++) {
        refs.push(ref() as Ref<Array<HTMLCanvasElement>>);
      }
      canvasRefs.value = refs;
      totalPages.value = pdf.numPages;
    }
  } catch (error) {
    console.error("Error loadingTask PDF:", error);
  }
  let calcH = 0;
  for (let i = 0; i < totalPages.value; i++) {
    try {
      const page = await pdf.getPage(i + 1);
      // ----
      if (cancelRendering.value) {
        cancelRendering.value = false;
        renderPDF();
        break;
      }
      // ----
      const canvas = canvasRefs.value[i].value[0];
      var viewport = page.getViewport({ scale: 1 });
      var scale =
        ((canvas.parentNode as HTMLDivElement).clientWidth - 4) /
        viewport.width;
      const context = canvas.getContext("2d");
      const scaledViewport = page.getViewport({ scale: scale * dpr.value });
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      itemHeightList.value[i] = calcH +=
        scaledViewport.height / dpr.value + rowGap.value;
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
    } catch (error) {
      console.error("Error rendering PDF:", error);
    }
    if (i === totalPages.value - 1) {
      renderComplete.value = true;
    }
  }
};

const viewportHeight = ref(0);
const isScrolling = ref(false);

let scrollTimer: number;
const handleScroll = (event: any) => {
  isScrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling.value = false;
  }, 1000);
  scrollOffset.value = event.target.scrollTop;
  emit("onScroll", event.target.scrollTop);
  if (
    scroller.value.scrollTop + scroller.value.offsetHeight >=
    scroller.value.scrollHeight - 10
  ) {
    currentPage.value = itemHeightList.value.length;
    return;
  }

  for (let i = 0; i < itemHeightList.value.length; i++) {
    const height = itemHeightList.value[i];
    if (height > event.target.scrollTop) {
      currentPage.value = i + 1;
      break;
    }
  }
};

let timer: number;
const renderPDFWithDebounce = () => {
  viewportHeight.value = window.innerHeight;
  if (
    Math.abs(innerWidth.value - window.innerWidth) > 1 &&
    Math.abs(containerWidth.value - container.value.offsetWidth) > 1
  ) {
    setWidth();
  } else {
    setWidth();
    return;
  }
  cancelRendering.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    renderComplete.value && renderPDF();
  }, 500);
};

const innerWidth = ref<number>(0);
const containerWidth = ref<number>(0);
const setWidth = () => {
  innerWidth.value = window.innerWidth;
  containerWidth.value = container.value.offsetWidth;
};
onMounted(() => {
  dpr.value = window.devicePixelRatio || 1;
  viewportHeight.value = window.innerHeight;
  setWidth();
  renderPDF();
  window.addEventListener("resize", renderPDFWithDebounce);
});

onUnmounted(() => {
  clearTimeout(timer);
  clearTimeout(scrollTimer);
  cancelAnimationFrame(animFrameId);
  window.removeEventListener("resize", renderPDFWithDebounce);
});
// --- back to top ---
let animFrameId: number;
const easeOutCubic = (progress: number) => {
  return 1 - Math.pow(1 - progress, 3);
};
const backToTop = () => {
  const duration = 500;
  const startPos = scroller.value.scrollTop;
  const startTime = performance.now();

  const animateScroll = (timestamp: number) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutCubic(progress);
    const distance = startPos * (1 - easeProgress);

    scroller.value.scrollTo(0, distance);

    if (progress < 1) {
      animFrameId = requestAnimationFrame(animateScroll);
    }
  };
  cancelAnimationFrame(animFrameId);
  requestAnimationFrame(animateScroll);
};
</script>

<template>
  <div
    class="pdf-vue3-main"
    style="height: 100%; position: relative; min-height: 10px"
  >
    <div class="pdf-vue3-container" style="height: 100%">
      <div
        ref="scroller"
        class="pdf-vue3-scroller"
        style="height: 100%; overflow-y: auto"
        :style="{ maxHeight: `${viewportHeight}px` }"
        @scroll="handleScroll"
      >
        <div
          class="pdf-vue3-canvas-container"
          ref="container"
          style="margin: 0 auto"
          :style="{
            width: isNaN(Number(props.pdfWidth))
              ? props.pdfWidth
              : `${props.pdfWidth}px`,
          }"
        >
          <canvas
            style="
              display: block;
              box-shadow: #a9a9a9 0px 1px 3px 0px;
              margin-left: auto;
              margin-right: auto;
              width: calc(100% - 4px);
            "
            :style="{
              marginBottom: `${rowGap}px`,
            }"
            v-for="item in totalPages"
            :key="item"
            :ref="canvasRefs[item - 1]"
          ></canvas>
        </div>
      </div>
    </div>
    <div
      class="pdf-vue3-progress"
      v-if="props.showProgress"
      style="
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        user-select: none;
        pointer-events: none;
      "
    >
      <slot v-if="slots.progress" name="progress" :loadRatio="loadRatio"></slot>
      <div
        v-else
        style="width: 0%; height: 4px; transition: all 0.2s"
        :style="{
          width: `${loadRatio}%`,
          opacity: loadRatio < 100 ? '1' : '0',
          backgroundColor: props.progressColor,
        }"
      ></div>
    </div>
    <div
      class="pdf-vue3-pageTooltip"
      v-if="props.showPageTooltip"
      style="
        position: absolute;
        left: 12px;
        top: 12px;
        width: calc(100% - 12px);
        user-select: none;
        pointer-events: none;
      "
    >
      <slot
        v-if="slots.pageTooltip"
        name="pageTooltip"
        :currentPage="currentPage"
        :totalPages="totalPages"
      ></slot>
      <div
        v-else
        style="
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.5);
          color: #ffffff;
          font-size: 16px;
          border-radius: 6px;
          display: inline-block;
          transition: opacity 0.3s;
        "
        :style="{ opacity: isScrolling && totalPages > 0 ? '1' : '0' }"
      >
        {{ currentPage }}/{{ totalPages }}
      </div>
    </div>
    <div
      class="pdf-vue3-backToTopBtn"
      v-if="props.showBackToTopBtn"
      @click="backToTop"
      style="
        position: absolute;
        right: 16px;
        bottom: 16px;
        display: inline-block;
        user-select: none;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      "
      :style="
        scrollOffset > props.scrollThreshold
          ? { opacity: '1', pointerEvents: 'initial' }
          : undefined
      "
    >
      <slot
        v-if="slots.backToTopBtn"
        name="backToTopBtn"
        :scrollOffset="scrollOffset"
      ></slot>
      <div
        v-else
        style="
          width: 50px;
          height: 50px;
          background: rgba(0, 0, 0, 0.4);
          color: #ffffff;
          font-size: 16px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M11.0001 22.2877H13.0001V7.80237L16.2428 11.045L17.657 9.63079L12.0001 3.97394L6.34326 9.63079L7.75748 11.045L11.0001 7.80236V22.2877ZM18 3H6V1H18V3Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style></style>
