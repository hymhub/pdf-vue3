declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    src: {
        type: import("vue").PropType<string | Uint8Array>;
        required: true;
        default: undefined;
    };
    httpHeaders: {
        type: import("vue").PropType<Record<string, any>>;
        default: undefined;
    };
    withCredentials: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    password: {
        type: import("vue").PropType<string>;
        default: undefined;
    };
    useSystemFonts: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    stopAtErrors: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableFontFace: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableRange: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableStream: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableAutoFetch: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    showProgress: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    progressColor: {
        type: import("vue").PropType<string>;
        default: string;
    };
    showPageTooltip: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    showBackToTopBtn: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    scrollThreshold: {
        type: import("vue").PropType<number>;
        default: number;
    };
    pdfWidth: {
        type: import("vue").PropType<string>;
        default: string;
    };
    rowGap: {
        type: import("vue").PropType<number>;
        default: number;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    onProgress: (loadRatio: number) => void;
    onComplete: () => void;
    onScroll: (scrollOffset: number) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    src: {
        type: import("vue").PropType<string | Uint8Array>;
        required: true;
        default: undefined;
    };
    httpHeaders: {
        type: import("vue").PropType<Record<string, any>>;
        default: undefined;
    };
    withCredentials: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    password: {
        type: import("vue").PropType<string>;
        default: undefined;
    };
    useSystemFonts: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    stopAtErrors: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableFontFace: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableRange: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableStream: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    disableAutoFetch: {
        type: import("vue").PropType<boolean>;
        default: undefined;
    };
    showProgress: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    progressColor: {
        type: import("vue").PropType<string>;
        default: string;
    };
    showPageTooltip: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    showBackToTopBtn: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    scrollThreshold: {
        type: import("vue").PropType<number>;
        default: number;
    };
    pdfWidth: {
        type: import("vue").PropType<string>;
        default: string;
    };
    rowGap: {
        type: import("vue").PropType<number>;
        default: number;
    };
}>> & {
    onOnProgress?: ((loadRatio: number) => any) | undefined;
    onOnComplete?: (() => any) | undefined;
    onOnScroll?: ((scrollOffset: number) => any) | undefined;
}, {
    src: string | Uint8Array;
    httpHeaders: Record<string, any>;
    withCredentials: boolean;
    password: string;
    useSystemFonts: boolean;
    stopAtErrors: boolean;
    disableFontFace: boolean;
    disableRange: boolean;
    disableStream: boolean;
    disableAutoFetch: boolean;
    showProgress: boolean;
    progressColor: string;
    showPageTooltip: boolean;
    showBackToTopBtn: boolean;
    scrollThreshold: number;
    pdfWidth: string;
    rowGap: number;
}, {}>, {
    progress?: ((props: {
        loadRatio: number;
    }) => any) | undefined;
    pageTooltip?: ((props: {
        currentPage: number;
        totalPages: number;
    }) => any) | undefined;
    backToTopBtn?: ((props: {
        scrollOffset: number;
    }) => any) | undefined;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
