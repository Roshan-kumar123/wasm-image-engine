import { useRef, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useImageWorker } from "./hooks/use-image-worker";
import { useEditorStore } from "./store/use-editor-store";
import { EditorLayout } from "./components/EditorLayout";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { FilterType } from "./types/image-worker.types";

export default function App() {
  const { processImage, revokeProcessedUrl } = useImageWorker();

  // Cache decoded ImageData between filter clicks so we don't re-decode the
  // File on every selection — the Wasm functions mutate in place, so we always
  // clone this ref before sending to the worker.
  const imageDataRef = useRef<ImageData | null>(null);

  const isProcessing = useEditorStore((s) => s.isProcessing);
  const originalImage = useEditorStore((s) => s.originalImage);
  const setActiveFilter = useEditorStore((s) => s.setActiveFilter);
  const reset = useEditorStore((s) => s.reset);

  // Called by DropzoneArea / LandingPage once a File has been decoded to ImageData
  const handleImageData = useCallback((imageData: ImageData) => {
    imageDataRef.current = imageData;
  }, []);

  // Called when the user clicks a filter button in the Sidebar
  const handleFilterSelect = useCallback(
    (filter: FilterType) => {
      if (!imageDataRef.current) return;
      setActiveFilter(filter);
      processImage(imageDataRef.current, filter);
    },
    [setActiveFilter, processImage],
  );

  // ── Clear / Reset Flow ────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    revokeProcessedUrl();
    imageDataRef.current = null;
    reset();
  }, [revokeProcessedUrl, reset]);

  const hasImage = originalImage !== null;

  return (
    <EditorLayout
      hasImage={hasImage}
      sidebar={
        <Sidebar onFilterSelect={handleFilterSelect} hasImage={hasImage} />
      }
      main={
        hasImage ? (
          // ── Editor mode ────────────────────────────────────────────────────
          <div className="flex flex-col flex-1 gap-4 p-5 overflow-hidden min-h-0">
            {/* Header row */}
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-white/60 text-sm font-medium">Editor</h2>
              <button
                onClick={handleClear}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear image
              </button>
            </div>

            {/* Canvas area */}
            <div className="relative flex-1 overflow-hidden min-h-0 rounded-xl bg-white/3">
              <ErrorBoundary onReset={handleClear}>
                <Canvas />
                {isProcessing && <LoadingSpinner />}
              </ErrorBoundary>
            </div>
          </div>
        ) : (
          // ── Landing mode ───────────────────────────────────────────────────
          <div className="flex-1 overflow-y-auto">
            <LandingPage onImageData={handleImageData} />
          </div>
        )
      }
    />
  );
}
