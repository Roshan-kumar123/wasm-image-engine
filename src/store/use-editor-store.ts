import { create } from 'zustand';
import type { FilterType, FilterLayer } from '../types/image-worker.types';

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

interface EditorState {
  originalImage: File | null;
  processedImageUrl: string | null;
  isProcessing: boolean;
  filterStack: FilterLayer[];
  workerError: string | null;
  processingTimeMs: number | null;
}

interface EditorActions {
  setOriginalImage: (file: File | null) => void;
  setProcessedImageUrl: (url: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  addFilterToStack: (type: FilterType) => void;
  updateFilterValue: (id: string, newValue: number) => void;
  removeFilterFromStack: (id: string) => void;
  clearStack: () => void;
  setWorkerError: (error: string | null) => void;
  setProcessingTimeMs: (ms: number | null) => void;
  reset: () => void;
}

const initialState: EditorState = {
  originalImage: null,
  processedImageUrl: null,
  isProcessing: false,
  filterStack: [],
  workerError: null,
  processingTimeMs: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,

  setOriginalImage: (file) => set({ originalImage: file }),
  setProcessedImageUrl: (url) => set({ processedImageUrl: url }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),

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

  clearStack: () => set({ filterStack: [], processedImageUrl: null, processingTimeMs: null }),

  setWorkerError: (error) => set({ workerError: error }),
  setProcessingTimeMs: (ms) => set({ processingTimeMs: ms }),

  reset: () => set(initialState),
}));
