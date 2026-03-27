import { create } from 'zustand';
import type { FilterType } from '../types/image-worker.types';

interface EditorState {
  originalImage: File | null;
  processedImageUrl: string | null;
  isProcessing: boolean;
  activeFilter: FilterType | null;
  workerError: string | null;
}

interface EditorActions {
  setOriginalImage: (file: File | null) => void;
  setProcessedImageUrl: (url: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setActiveFilter: (filter: FilterType | null) => void;
  setWorkerError: (error: string | null) => void;
  reset: () => void;
}

const initialState: EditorState = {
  originalImage: null,
  processedImageUrl: null,
  isProcessing: false,
  activeFilter: null,
  workerError: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,
  setOriginalImage: (file) => set({ originalImage: file }),
  setProcessedImageUrl: (url) => set({ processedImageUrl: url }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setWorkerError: (error) => set({ workerError: error }),
  reset: () => set(initialState),
}));
