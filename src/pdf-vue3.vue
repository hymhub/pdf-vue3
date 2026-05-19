<script setup lang="ts">
import {
  ref,
  shallowRef,
  onUnmounted,
  Ref,
  computed,
  watch,
  onBeforeMount,
  nextTick,
} from "vue";
import type { PDFDocumentProxy, PDFPageProxy } from "./index";

let GlobalWorkerOptions: any, getDocument: any;
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
    page?: number;
    cMapUrl?: string;
    /**
     * Zoom scale (1 = 100%). Re-renders pages at the new resolution to keep crisp.
     */
    scale?: number;
    /**
     * Enable virtualized rendering (only renders pages near the viewport).
     * Strongly recommended for large PDFs. Default: true.
     */
    virtual?: boolean;
    /**
     * Number of extra pages to render above/below the viewport.
     */
    preloadPages?: number;
    /**
     * Workaround for some hosts where the bundled worker URL fails.
     * If provided, GlobalWorkerOptions.workerSrc is set to this value.
     */
    workerSrc?: string;
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
    page: 1,
    cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
    scale: 1,
    virtual: true,
    preloadPages: 2,
    workerSrc: undefined,
  }
);

const rowGap = computed(() => parseInt(String(props.rowGap)));
const scaleProp = computed(() => Number(props.scale) || 1);

const emit = defineEmits<{
  (e: "onProgress", loadRatio: number): void;
  (e: "onComplete"): void;
  (e: "onScroll", scrollOffset: number): void;
  (e: "onPageChange", page: number): void;
  /**
   * https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html
   */
  (e: "onPdfInit", pdf: PDFDocumentProxy): void;
  /**
   * Fired when loading or rendering fails. Receives the underlying Error.
   */
  (e: "onError", error: Error): void;
}>();

const slots = defineSlots<{
  progress?: (props: { loadRatio: number }) => any;
  pageTooltip?: (props: { currentPage: number; totalPages: number }) => any;
  backToTopBtn?: (props: { scrollOffset: number }) => any;
  pagePlaceholder?: (props: { page: number; width: number; height: number }) => any;
}>();

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

interface PageMeta {
  /** Natural width of the page at scale=1 */
  baseWidth: number;
  /** Natural height of the page at scale=1 */
  baseHeight: number;
  /** Rendered width in CSS pixels (after fit-to-container + scale) */
  renderWidth: number;
  /** Rendered height in CSS pixels (after fit-to-container + scale) */
  renderHeight: number;
  /** Scale used to fit container width */
  fitScale: number;
  /** Final scale used during rendering (fitScale * dpr) */
  finalScale: number;
  /** Whether the canvas has been rendered at the current state */
  rendered: boolean;
  /** Whether the canvas is currently in view (or in pre-render window) */
  inView: boolean;
}

const loadRatio = ref(0);
// Note: keep these as plain (non-reactive) refs to avoid deep-tracking PDF.js internals,
// which is heavy and was a source of the memory leak reported in #18.
let loadingTask: any = null;
let pdfDoc: PDFDocumentProxy | null = null;

const totalPages = ref(0);
const currentPage = ref(1);
const scrollOffset = ref(0);
const pagesMeta = shallowRef<PageMeta[]>([]);
const canvasEls = shallowRef<Array<HTMLCanvasElement | null>>([]);

const scroller = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const container = ref<HTMLDivElement>() as Ref<HTMLDivElement>;

const isDestroyed = ref(false);
const isInitialized = ref(false);
const renderComplete = ref(false);

const isUrlLike = (s: string): boolean => {
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (/^blob:/i.test(s)) return true;
  if (/^file:/i.test(s)) return true;
  if (/^\/\//.test(s)) return true;
  if (/^\.{0,2}\//.test(s)) return true;
  return false;
};

const isDataUri = (s: string): boolean => {
  return /^data:/i.test(s);
};

const isBase64Like = (s: string): boolean => {
  // Strip data URI prefix when present
  const stripped = s.includes(",") ? s.split(",")[1] : s;
  // Must be reasonably long and only contain base64 chars
  return stripped.length > 0 && /^[A-Za-z0-9+/=\s]+$/.test(stripped);
};

const base64ToBytes = (raw: string): Uint8Array => {
  const data = raw.includes(",") ? raw.split(",")[1] : raw;
  const binaryData = atob(data);
  const byteArray = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    byteArray[i] = binaryData.charCodeAt(i);
  }
  return byteArray;
};

const buildLoadOption = (): Option => {
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
    cMapUrl: props.cMapUrl,
    cMapPacked: true,
  };
  if (props.src instanceof Uint8Array) {
    option.data = props.src;
  } else if (typeof props.src === "string") {
    if (isDataUri(props.src) || (!isUrlLike(props.src) && isBase64Like(props.src))) {
      option.data = base64ToBytes(props.src);
    } else {
      // Treat anything that looks like a URL (http(s)/blob/file/relative) as a URL.
      // This fixes #29 (presigned URLs), #22 (query params), #19 (.PDF/.Pdf), #26 (case).
      option.url = props.src;
    }
  }
  for (const key in option) {
    if (option[key] === undefined) {
      delete option[key];
    }
  }
  return option;
};

const getDoc = () => {
  if (isDestroyed.value) return;
  cleanupExistingDoc();
  const option = buildLoadOption();
  loadRatio.value = 0;
  try {
    loadingTask = getDocument(option);
    loadingTask.onProgress = (progressData: any) => {
      if (isDestroyed.value) return;
      const total = progressData.total || 0;
      const loaded = progressData.loaded || 0;
      const ratio = total > 0 ? (loaded / total) * 100 : 0;
      loadRatio.value = ratio >= 100 ? 100 : ratio;
      emit("onProgress", loadRatio.value);
    };
    loadingTask.promise.then(
      () => {
        if (isDestroyed.value) return;
        loadRatio.value = 100;
        emit("onComplete");
      },
      (err: Error) => {
        if (isDestroyed.value) return;
        console.error("[pdf-vue3] load failed:", err);
        emit("onError", err);
      }
    );
  } catch (err) {
    console.error("[pdf-vue3] failed to create loading task:", err);
    emit("onError", err as Error);
  }
};

/** Recompute fitScale based on current container width and props.scale. */
const computeFitScale = (baseWidth: number): number => {
  const cw = (container.value?.clientWidth || 0) - 4;
  if (cw <= 0 || baseWidth <= 0) return scaleProp.value;
  return (cw / baseWidth) * scaleProp.value;
};

/** Page positions cache (top offset in CSS pixels). */
const pageTops = shallowRef<number[]>([]);
const totalHeight = ref(0);

const recomputeLayout = () => {
  const metas = pagesMeta.value;
  const tops: number[] = new Array(metas.length);
  let acc = 0;
  for (let i = 0; i < metas.length; i++) {
    tops[i] = acc;
    acc += metas[i].renderHeight + rowGap.value;
  }
  pageTops.value = tops;
  totalHeight.value = Math.max(acc - rowGap.value, 0);
};

/** Load metadata (viewport) for all pages and compute layout. */
const loadAllPageMeta = async () => {
  if (!pdfDoc) return;
  const num = pdfDoc.numPages;
  const metas: PageMeta[] = [];
  for (let i = 1; i <= num; i++) {
    if (isDestroyed.value) return;
    try {
      const page: PDFPageProxy = await pdfDoc.getPage(i);
      const v = page.getViewport({ scale: 1 });
      const fit = computeFitScale(v.width);
      metas.push({
        baseWidth: v.width,
        baseHeight: v.height,
        fitScale: fit,
        finalScale: fit * dpr.value,
        renderWidth: v.width * fit,
        renderHeight: v.height * fit,
        rendered: false,
        inView: false,
      });
      page.cleanup();
    } catch (err) {
      console.error(`[pdf-vue3] failed to read page ${i} meta:`, err);
      emit("onError", err as Error);
      metas.push({
        baseWidth: 595,
        baseHeight: 842,
        fitScale: 1,
        finalScale: dpr.value,
        renderWidth: 595,
        renderHeight: 842,
        rendered: false,
        inView: false,
      });
    }
  }
  if (isDestroyed.value) return;
  pagesMeta.value = metas;
  canvasEls.value = new Array(metas.length).fill(null);
  recomputeLayout();
};

/** Pending render tasks keyed by page index (0-based). */
const renderTasks = new Map<number, any>();

/** In-flight page proxies (so we can cleanup them). */
const livePages = new Map<number, PDFPageProxy>();

const cancelRender = (idx: number) => {
  const t = renderTasks.get(idx);
  if (t) {
    try {
      t.cancel();
    } catch (e) {
      // ignore
    }
    renderTasks.delete(idx);
  }
};

const releasePage = (idx: number) => {
  cancelRender(idx);
  const p = livePages.get(idx);
  if (p) {
    try {
      p.cleanup();
    } catch (e) {
      // ignore
    }
    livePages.delete(idx);
  }
  const meta = pagesMeta.value[idx];
  if (meta) meta.rendered = false;
  const c = canvasEls.value[idx];
  if (c) {
    const ctx = c.getContext("2d");
    if (ctx) {
      try {
        ctx.clearRect(0, 0, c.width, c.height);
      } catch (e) {
        // ignore
      }
    }
    // Drop pixel data to free memory
    c.width = 0;
    c.height = 0;
  }
};

const renderPage = async (idx: number) => {
  if (isDestroyed.value || !pdfDoc) return;
  const meta = pagesMeta.value[idx];
  if (!meta || meta.rendered) return;
  const canvas = canvasEls.value[idx];
  if (!canvas) return;
  cancelRender(idx);
  try {
    const page = await pdfDoc.getPage(idx + 1);
    if (isDestroyed.value) {
      try {
        page.cleanup();
      } catch (e) {}
      return;
    }
    livePages.set(idx, page);
    const finalScale = meta.finalScale;
    const viewport = page.getViewport({ scale: finalScale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = meta.renderWidth + "px";
    canvas.style.height = meta.renderHeight + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const task = page.render({
      canvasContext: ctx as CanvasRenderingContext2D,
      viewport,
    });
    renderTasks.set(idx, task);
    await task.promise;
    renderTasks.delete(idx);
    if (isDestroyed.value) return;
    meta.rendered = true;
  } catch (err: any) {
    if (err?.name === "RenderingCancelledException") {
      return;
    }
    console.error(`[pdf-vue3] failed to render page ${idx + 1}:`, err);
    emit("onError", err);
  }
};

const viewportHeight = ref(0);
const isScrolling = ref(false);

/** Compute the visible page range based on scrollOffset. */
const computeVisibleRange = (): { start: number; end: number } => {
  const tops = pageTops.value;
  const metas = pagesMeta.value;
  if (!tops.length || !metas.length || !scroller.value) {
    return { start: 0, end: -1 };
  }
  const top = scroller.value.scrollTop;
  const bottom = top + scroller.value.clientHeight;
  let start = 0;
  let end = metas.length - 1;
  for (let i = 0; i < tops.length; i++) {
    const t = tops[i];
    const b = t + metas[i].renderHeight;
    if (b >= top) {
      start = i;
      break;
    }
  }
  for (let i = start; i < tops.length; i++) {
    const t = tops[i];
    if (t > bottom) {
      end = i - 1;
      break;
    }
  }
  if (end < start) end = start;
  const pre = Math.max(0, props.preloadPages || 0);
  return {
    start: Math.max(0, start - pre),
    end: Math.min(metas.length - 1, end + pre),
  };
};

/** Update which pages are inView and trigger render/release accordingly. */
const updateInView = () => {
  if (isDestroyed.value) return;
  const metas = pagesMeta.value;
  if (!metas.length) return;
  const { start, end } = computeVisibleRange();
  const useVirtual = props.virtual !== false;
  const targetStart = useVirtual ? start : 0;
  const targetEnd = useVirtual ? end : metas.length - 1;

  for (let i = 0; i < metas.length; i++) {
    const m = metas[i];
    const shouldBeInView = i >= targetStart && i <= targetEnd;
    if (shouldBeInView && !m.inView) {
      m.inView = true;
    } else if (!shouldBeInView && m.inView) {
      m.inView = false;
    }
  }
  // Force template update because we mutated shallowRef entries
  pagesMeta.value = [...metas];

  void nextTick(() => {
    for (let i = targetStart; i <= targetEnd; i++) {
      const m = metas[i];
      if (m && !m.rendered) {
        void renderPage(i);
      }
    }
    if (useVirtual) {
      // Release pages well outside the window to keep memory bounded.
      const releaseRadius = (props.preloadPages || 0) + 2;
      for (let i = 0; i < metas.length; i++) {
        if (i < targetStart - releaseRadius || i > targetEnd + releaseRadius) {
          if (metas[i].rendered) {
            releasePage(i);
          }
        }
      }
    }
  });
};

let scrollTimer: number;
const handleScroll = (event: Event) => {
  if (!scroller.value) return;
  isScrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    isScrolling.value = false;
  }, 1000);
  const target = event.target as HTMLElement;
  scrollOffset.value = target.scrollTop;
  emit("onScroll", target.scrollTop);

  if (
    scroller.value.scrollTop + scroller.value.offsetHeight >=
    scroller.value.scrollHeight - 10
  ) {
    currentPage.value = pagesMeta.value.length;
  } else {
    const tops = pageTops.value;
    const metas = pagesMeta.value;
    for (let i = 0; i < tops.length; i++) {
      const t = tops[i];
      const b = t + (metas[i]?.renderHeight || 0);
      if (b > target.scrollTop + 4) {
        currentPage.value = i + 1;
        break;
      }
    }
  }
  updateInView();
};

const cleanupExistingDoc = () => {
  for (const idx of Array.from(renderTasks.keys())) {
    cancelRender(idx);
  }
  for (const idx of Array.from(livePages.keys())) {
    try {
      livePages.get(idx)?.cleanup();
    } catch (e) {}
  }
  livePages.clear();
  if (pdfDoc) {
    try {
      pdfDoc.cleanup();
    } catch (e) {}
    try {
      pdfDoc.destroy();
    } catch (e) {}
    pdfDoc = null;
  }
  if (loadingTask) {
    try {
      loadingTask.destroy();
    } catch (e) {}
    loadingTask = null;
  }
};

/** Full rebuild: load doc -> read all page metas -> set up virtual scroll. */
const renderPDF = async () => {
  renderComplete.value = false;
  try {
    if (!loadingTask) return;
    pdfDoc = await loadingTask.promise;
    if (isDestroyed.value || !pdfDoc) return;
    totalPages.value = pdfDoc.numPages;
    emit("onPdfInit", pdfDoc);
    await loadAllPageMeta();
    if (isDestroyed.value) return;
    await nextTick();
    applyPageProp();
    updateInView();
    renderComplete.value = true;
  } catch (err: any) {
    if (err?.name === "RenderingCancelledException") return;
    console.error("[pdf-vue3] renderPDF failed:", err);
    emit("onError", err as Error);
  }
};

const innerWidth = ref<number>(0);
const containerWidth = ref<number>(0);
const setWidth = () => {
  if (typeof window === "undefined" || !container.value) return;
  innerWidth.value = window.innerWidth;
  containerWidth.value = container.value.offsetWidth;
};

/** Re-layout (no re-load) after width or scale change. */
const reflow = () => {
  const metas = pagesMeta.value;
  if (!metas.length) {
    setWidth();
    return;
  }
  setWidth();
  for (let i = 0; i < metas.length; i++) {
    const m = metas[i];
    const fit = computeFitScale(m.baseWidth);
    m.fitScale = fit;
    m.finalScale = fit * dpr.value;
    m.renderWidth = m.baseWidth * fit;
    m.renderHeight = m.baseHeight * fit;
    if (m.rendered) {
      releasePage(i);
    }
  }
  pagesMeta.value = [...metas];
  recomputeLayout();
  updateInView();
};

let resizeTimer: number;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (isDestroyed.value) return;
    viewportHeight.value = window.innerHeight;
    reflow();
  }, 200);
};

const isAddEvent = ref(false);

const applyPageProp = () => {
  if (!props.page || !pagesMeta.value.length) return;
  let p = Math.max(1, Math.min(props.page, pagesMeta.value.length));
  if (p === currentPage.value) return;
  scrollToPage(p);
};

onBeforeMount(async () => {
  if (typeof window === "undefined") return;
  try {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;
    getDocument = pdfjs.getDocument;
    let workerSrc = props.workerSrc;
    if (!workerSrc) {
      workerSrc = new URL(
        "../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
      ).href;
    }
    GlobalWorkerOptions.workerSrc = workerSrc;
    dpr.value = window.devicePixelRatio || 1;
    viewportHeight.value = window.innerHeight;
    await nextTick();
    setWidth();
    const hasSrc =
      (typeof props.src === "string" && props.src.length > 0) ||
      props.src instanceof Uint8Array;
    if (hasSrc) {
      getDoc();
      void renderPDF();
      window.addEventListener("resize", handleResize);
      isAddEvent.value = true;
    }
    isInitialized.value = true;
    watch(
      () => props.src,
      (src: string | Uint8Array) => {
        const ok =
          (typeof src === "string" && src.length > 0) ||
          src instanceof Uint8Array;
        if (!ok) return;
        getDoc();
        void renderPDF();
        if (!isAddEvent.value) {
          window.addEventListener("resize", handleResize);
          isAddEvent.value = true;
        }
      }
    );
    watch(scaleProp, () => {
      if (!isInitialized.value) return;
      reflow();
    });
  } catch (err) {
    console.error("[pdf-vue3] init failed:", err);
    emit("onError", err as Error);
  }
});

onUnmounted(() => {
  isDestroyed.value = true;
  clearTimeout(scrollTimer);
  clearTimeout(resizeTimer);
  cancelAnimationFrame(animFrameId);
  if (isAddEvent.value && typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
  cleanupExistingDoc();
});

// --- back to top ---
let animFrameId: number = 0;
const easeOutCubic = (progress: number) => {
  return 1 - Math.pow(1 - progress, 3);
};
const backToTop = () => {
  if (!scroller.value) return;
  const duration = 500;
  const startPos = scroller.value.scrollTop;
  const startTime = performance.now();

  const animateScroll = (timestamp: number) => {
    if (isDestroyed.value || !scroller.value) return;
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
  animFrameId = requestAnimationFrame(animateScroll);
};

const scrollToPage = (page: number) => {
  if (!scroller.value || !pageTops.value.length) return;
  const idx = Math.max(0, Math.min(page - 1, pageTops.value.length - 1));
  const y = pageTops.value[idx];
  scroller.value.scrollTo(0, y + 2);
};

let waitToPageFun: Function | null = null;
watch(
  () => props.page,
  (page: number) => {
    if (page === currentPage.value) return;
    if (renderComplete.value) {
      scrollToPage(page);
    } else {
      waitToPageFun = () => scrollToPage(page);
    }
  }
);
watch(
  () => renderComplete.value,
  (complete: boolean) => {
    if (complete && waitToPageFun) {
      waitToPageFun();
      waitToPageFun = null;
    }
  }
);
watch(
  () => currentPage.value,
  (page: number) => {
    emit("onPageChange", page);
  }
);

const setCanvasRef = (idx: number) => (el: any) => {
  if (!canvasEls.value) return;
  const arr = canvasEls.value.slice();
  arr[idx] = (el as HTMLCanvasElement) || null;
  canvasEls.value = arr;
  // If the page was previously in view but lost its canvas (e.g. recreated by v-if),
  // re-render it.
  const meta = pagesMeta.value[idx];
  if (el && meta && meta.inView && !meta.rendered) {
    void renderPage(idx);
  }
};

const print = async () => {
  if (!pdfDoc) return;
  if (typeof window === "undefined") return;
  try {
    const data = await pdfDoc.getData();
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("[pdf-vue3] print failed:", e);
        emit("onError", e as Error);
      }
    };
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      iframe.remove();
    }, 60_000);
  } catch (err) {
    console.error("[pdf-vue3] print failed:", err);
    emit("onError", err as Error);
  }
};

const download = async (filename?: string) => {
  if (!pdfDoc) return;
  if (typeof window === "undefined") return;
  try {
    const data = await pdfDoc.getData();
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "document.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch (err) {
    console.error("[pdf-vue3] download failed:", err);
    emit("onError", err as Error);
  }
};

defineExpose({
  /**
   * Re-layout the viewer. Useful when the container size changes but the
   * window does not (e.g. flex/grid layout, panel toggle).
   */
  reload: () => {
    if (typeof window !== "undefined") {
      innerWidth.value = window.innerWidth - 2;
    }
    setWidth();
    reflow();
  },
  /** Programmatically scroll to a given page. */
  goToPage: (page: number) => {
    scrollToPage(page);
  },
  /** Get the underlying PDFDocumentProxy (null until loaded). */
  getPdf: (): PDFDocumentProxy | null => pdfDoc,
  /** Get total pages. */
  getTotalPages: () => totalPages.value,
  /** Get current page. */
  getCurrentPage: () => currentPage.value,
  /** Print the PDF via a hidden iframe. */
  print,
  /** Download the original PDF data. */
  download,
  /** Manually destroy the loaded document (a new load will start when `src` changes). */
  destroy: () => {
    cleanupExistingDoc();
    pagesMeta.value = [];
    canvasEls.value = [];
    pageTops.value = [];
    totalHeight.value = 0;
    totalPages.value = 0;
    currentPage.value = 1;
    renderComplete.value = false;
  },
});
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
          style="margin: 0 auto; position: relative"
          :style="{
            width: isNaN(Number(props.pdfWidth))
              ? props.pdfWidth
              : `${props.pdfWidth}px`,
            height: totalHeight ? `${totalHeight}px` : 'auto',
          }"
        >
          <div
            v-for="(meta, idx) in pagesMeta"
            :key="idx"
            class="pdf-vue3-page"
            :style="{
              position: 'absolute',
              top: `${pageTops[idx] || 0}px`,
              left: 0,
              right: 0,
              width: '100%',
              height: `${meta.renderHeight}px`,
              display: 'flex',
              justifyContent: 'center',
            }"
          >
            <canvas
              v-if="meta.inView || !props.virtual"
              :ref="setCanvasRef(idx)"
              class="pdf-vue3-canvas"
              style="
                display: block;
                box-shadow: #a9a9a9 0px 1px 3px 0px;
                background: #fff;
              "
              :style="{
                width: `${meta.renderWidth}px`,
                height: `${meta.renderHeight}px`,
              }"
            ></canvas>
            <slot
              v-else
              name="pagePlaceholder"
              :page="idx + 1"
              :width="meta.renderWidth"
              :height="meta.renderHeight"
            >
              <div
                class="pdf-vue3-page-placeholder"
                :style="{
                  width: `${meta.renderWidth}px`,
                  height: `${meta.renderHeight}px`,
                  background:
                    'repeating-linear-gradient(45deg,#f4f4f4,#f4f4f4 10px,#ececec 10px,#ececec 20px)',
                  boxShadow: '#a9a9a9 0px 1px 3px 0px',
                }"
              ></div>
            </slot>
          </div>
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
