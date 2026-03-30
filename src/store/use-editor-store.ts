import { create } from 'zustand';
import type { FilterType } from '../types/image-worker.types';

interface EditorState {
  originalImage: File | null;
  processedImageUrl: string | null;
  isProcessing: boolean;
  activeFilter: FilterType | null;
  workerError: string | null;
  processingTimeMs: number | null;
  filterParameter: number;
}

interface EditorActions {
  setOriginalImage: (file: File | null) => void;
  setProcessedImageUrl: (url: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setActiveFilter: (filter: FilterType | null) => void;
  setWorkerError: (error: string | null) => void;
  setProcessingTimeMs: (ms: number | null) => void;
  setFilterParameter: (value: number) => void;
  reset: () => void;
}

const initialState: EditorState = {
  originalImage: null,
  processedImageUrl: null,
  isProcessing: false,
  activeFilter: null,
  workerError: null,
  processingTimeMs: null,
  filterParameter: 10,
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,
  setOriginalImage: (file) => set({ originalImage: file }),
  setProcessedImageUrl: (url) => set({ processedImageUrl: url }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setActiveFilter: (filter) =>
    set({
      activeFilter: filter,
      filterParameter: filter === 'blur' ? 10 : 100,
    }),
  setWorkerError: (error) => set({ workerError: error }),
  setProcessingTimeMs: (ms) => set({ processingTimeMs: ms }),
  setFilterParameter: (value) => set({ filterParameter: value }),
  reset: () => set(initialState),
}));
