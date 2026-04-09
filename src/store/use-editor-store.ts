import { create } from 'zustand';
import type { FilterType, FilterLayer, BatchImage } from '../types/image-worker.types';

// Default parameter value per filter type
export function defaultValueFor(type: FilterType): number {
  switch (type) {
    case 'blur':        return 10;
    case 'brightness':  return 50;
    case 'contrast':    return 50;
    case 'saturation':  return 50;
    default:            return 100;
  }
}

// Convenience selector — derive active BatchImage without repeating the find everywhere
export const selectActiveImage = (s: EditorState & EditorActions): BatchImage | null =>
  s.images.find((img) => img.id === s.activeImageId) ?? null;

interface EditorState {
  images: BatchImage[];
  activeImageId: string | null;
  isProcessing: boolean;
  filterStack: FilterLayer[];
  workerError: string | null;
  processingTimeMs: number | null;
  isBatchExporting: boolean;
  batchProgress: { current: number; total: number } | null;
}

interface EditorActions {
  // Image list management
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  setActiveImage: (id: string) => void;
  setActiveImageProcessedUrl: (id: string, url: string | null) => void;
  setActiveImageExported: (id: string) => void;

  // Filter stack
  addFilterToStack: (type: FilterType) => void;
  updateFilterValue: (id: string, newValue: number) => void;
  removeFilterFromStack: (id: string) => void;
  clearStack: () => void;

  // Processing state
  setIsProcessing: (processing: boolean) => void;
  setWorkerError: (error: string | null) => void;
  setProcessingTimeMs: (ms: number | null) => void;

  // Batch export state
  setBatchExporting: (exporting: boolean) => void;
  setBatchProgress: (progress: { current: number; total: number } | null) => void;

  // Global reset — caller must revoke all processedUrls before calling
  reset: () => void;
}

const initialState: EditorState = {
  images: [],
  activeImageId: null,
  isProcessing: false,
  filterStack: [],
  workerError: null,
  processingTimeMs: null,
  isBatchExporting: false,
  batchProgress: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,

  // ── Image list ──────────────────────────────────────────────────────────────

  addImages: (files) =>
    set((state) => {
      const newImages: BatchImage[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        objectUrl: URL.createObjectURL(file),
        processedUrl: null,
        hasBeenExported: false,
      }));
      const merged = [...state.images, ...newImages];
      return {
        images: merged,
        // Set activeImageId to first new image only if nothing was active
        activeImageId: state.activeImageId ?? newImages[0]?.id ?? null,
      };
    }),

  removeImage: (id) =>
    set((state) => {
      const target = state.images.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
        // processedUrl is owned by the hook — caller must call revokeProcessedUrl(id) first
      }
      const remaining = state.images.filter((img) => img.id !== id);
      const newActiveId =
        state.activeImageId === id
          ? (remaining[0]?.id ?? null)
          : state.activeImageId;
      return { images: remaining, activeImageId: newActiveId };
    }),

  setActiveImage: (id) => set({ activeImageId: id }),

  setActiveImageProcessedUrl: (id, url) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, processedUrl: url } : img,
      ),
    })),

  setActiveImageExported: (id) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, hasBeenExported: true } : img,
      ),
    })),

  // ── Filter stack ────────────────────────────────────────────────────────────

  addFilterToStack: (type) =>
    set((state) => ({
      filterStack: [
        ...state.filterStack,
        { id: crypto.randomUUID(), type, value: defaultValueFor(type) },
      ],
    })),

  updateFilterValue: (id, newValue) =>
    set((state) => ({
      filterStack: state.filterStack.map((layer) =>
        layer.id === id ? { ...layer, value: newValue } : layer,
      ),
    })),

  removeFilterFromStack: (id) =>
    set((state) => ({
      filterStack: state.filterStack.filter((layer) => layer.id !== id),
    })),

  clearStack: () => set({ filterStack: [], processingTimeMs: null }),

  // ── Processing state ────────────────────────────────────────────────────────

  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setWorkerError: (error) => set({ workerError: error }),
  setProcessingTimeMs: (ms) => set({ processingTimeMs: ms }),

  // ── Batch export state ──────────────────────────────────────────────────────

  setBatchExporting: (exporting) => set({ isBatchExporting: exporting }),
  setBatchProgress: (progress) => set({ batchProgress: progress }),

  // ── Global reset ────────────────────────────────────────────────────────────
  // Revokes all source objectUrls. Caller must revoke all processedUrls before calling.

  reset: () =>
    set((state) => {
      for (const img of state.images) {
        URL.revokeObjectURL(img.objectUrl);
        // processedUrl revocation is caller's responsibility (hook owns those)
      }
      return initialState;
    }),
}));
