import { useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useImageWorker } from "./hooks/use-image-worker";
import { useEditorStore } from "./store/use-editor-store";

// Inline export button — reads processedImageUrl directly from the store.
// Rendered in the editor header; hidden until a filter has been applied.
function ExportButton({ isProcessing }: { isProcessing: boolean }) {
  const processedImageUrl = useEditorStore((s) => s.processedImageUrl);
  if (!processedImageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = processedImageUrl;
    a.download = "edited-image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isProcessing}
      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-accent/20"
    >
      <Download className="w-3.5 h-3.5" />
      Export
    </button>
  );
}
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
  const filterParameter = useEditorStore((s) => s.filterParameter);
  const setActiveFilter = useEditorStore((s) => s.setActiveFilter);
  const reset = useEditorStore((s) => s.reset);

  // Called by DropzoneArea / LandingPage once a File has been decoded to ImageData
  const handleImageData = useCallback((imageData: ImageData) => {
    imageDataRef.current = imageData;
  }, []);

  // Called when the user clicks a filter button in the Sidebar
  const handleFilterSelect = useCallback(
    (filter: FilterType, parameter?: number) => {
      if (!imageDataRef.current) return;
      setActiveFilter(filter);
      // When called from a button click, parameter is undefined → worker uses its own default.
      // When called from a slider drag, parameter carries the explicit value.
      processImage(imageDataRef.current, filter, parameter);
    },
    [setActiveFilter, processImage, filterParameter],
  );

  // ── Clear / Reset Flow ────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    revokeProcessedUrl();
    imageDataRef.current = null;
    reset();
  }, [revokeProcessedUrl, reset]);

  const hasImage = originalImage !== null;

  // ── History API ───────────────────────────────────────────────────────────
  // On mount: if the user hard-refreshed on #editor, the store is empty but the
  // hash is stale. Strip it so the URL matches the landing page state.
  useEffect(() => {
    if (!hasImage && window.location.hash === '#editor') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push a history entry when the editor opens so the browser back button
  // navigates back to the landing page instead of leaving the app entirely.
  useEffect(() => {
    if (hasImage) {
      window.history.pushState({ view: 'editor' }, '', '#editor');
    }
  }, [hasImage]);

  // Listen for the browser back button: popstate fires when the user navigates
  // back from #editor → '', which should close the editor and show the landing page.
  useEffect(() => {
    const onPopState = () => {
      if (originalImage !== null) {
        revokeProcessedUrl();
        imageDataRef.current = null;
        reset();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [originalImage, revokeProcessedUrl, reset]);

  return (
    <EditorLayout
      hasImage={hasImage}
      sidebar={
        <Sidebar onFilterSelect={handleFilterSelect} hasImage={hasImage} onParameterChange={(filter, value) => handleFilterSelect(filter, value)} />
      }
      main={
        hasImage ? (
          // ── Editor mode ────────────────────────────────────────────────────
          <div className="flex flex-col flex-1 gap-4 p-5 overflow-hidden min-h-0">
            {/* Header row */}
            <div className="flex items-center justify-between shrink-0">
              <button
                onClick={() => window.history.back()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </button>
              <ExportButton isProcessing={isProcessing} />
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
