import { useRef, useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useImageWorker } from "./hooks/use-image-worker";
import { useEditorStore } from "./store/use-editor-store";
import { fileToImageData } from "./utils/file-to-image-data";
import { EditorLayout } from "./components/EditorLayout";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { TopActionBar } from "./components/TopActionBar";
import type { ViewMode } from "./components/TopActionBar";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { FilterType } from "./types/image-worker.types";

export default function App() {
  const { processImage, revokeProcessedUrl } = useImageWorker();

  const imageDataRef = useRef<ImageData | null>(null);

  // View mode: split (slider compare) vs single (hold-to-compare)
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  // Compare: true while user holds the Compare/Single button
  const [isComparing, setIsComparing] = useState(false);

  const isProcessing = useEditorStore((s) => s.isProcessing);
  const originalImage = useEditorStore((s) => s.originalImage);
  const processedImageUrl = useEditorStore((s) => s.processedImageUrl);
  const filterParameter = useEditorStore((s) => s.filterParameter);
  const setOriginalImage = useEditorStore((s) => s.setOriginalImage);
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
      processImage(imageDataRef.current, filter, parameter);
    },
    [setActiveFilter, processImage, filterParameter],
  );

  // ── Upload New: replace image without leaving the editor ─────────────────
  const handleUploadNew = useCallback(async (file: File) => {
    revokeProcessedUrl();
    const imageData = await fileToImageData(file);
    imageDataRef.current = imageData;
    reset();
    setOriginalImage(file);
    imageDataRef.current = imageData;
  }, [revokeProcessedUrl, reset, setOriginalImage]);

  // ── Reset: revert to original without clearing the image ─────────────────
  const handleReset = useCallback(() => {
    revokeProcessedUrl();
    useEditorStore.setState({
      processedImageUrl: null,
      activeFilter: null,
      processingTimeMs: null,
      filterParameter: 10,
    });
  }, [revokeProcessedUrl]);

  // ── Export HD: download the processed image ───────────────────────────────
  const handleExport = useCallback(() => {
    if (!processedImageUrl) return;
    const a = document.createElement("a");
    a.href = processedImageUrl;
    a.download = "edited-image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [processedImageUrl]);

  // ── Clear / go home ───────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    revokeProcessedUrl();
    imageDataRef.current = null;
    reset();
  }, [revokeProcessedUrl, reset]);

  const hasImage = originalImage !== null;

  // ── History API ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasImage && window.location.hash === "#editor") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasImage) {
      window.history.pushState({ view: "editor" }, "", "#editor");
    }
  }, [hasImage]);

  useEffect(() => {
    const onPopState = () => {
      if (originalImage !== null) {
        revokeProcessedUrl();
        imageDataRef.current = null;
        reset();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [originalImage, revokeProcessedUrl, reset]);

  return (
    <EditorLayout
      hasImage={hasImage}
      sidebar={
        <Sidebar
          onFilterSelect={handleFilterSelect}
          hasImage={hasImage}
          onParameterChange={(filter, value) => handleFilterSelect(filter, value)}
        />
      }
      main={
        hasImage ? (
          // ── Editor mode ────────────────────────────────────────────────
          <div className="flex flex-col flex-1 gap-3 p-4 sm:p-5 overflow-hidden min-h-0">
            {/* Nav */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => window.history.back()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-glass transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </button>
            </div>

            {/* Pro toolbar */}
            <TopActionBar
              isProcessing={isProcessing}
              hasProcessed={!!processedImageUrl}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onUploadNew={handleUploadNew}
              onReset={handleReset}
              onCompareStart={() => setIsComparing(true)}
              onCompareEnd={() => setIsComparing(false)}
              onExport={handleExport}
            />

            {/* Canvas — floating card */}
            <div className="relative flex-1 overflow-hidden min-h-0 rounded-2xl border border-border-subtle bg-surface-overlay shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)]">
              <ErrorBoundary onReset={handleClear}>
                <Canvas viewMode={viewMode} isComparing={isComparing} />
                {isProcessing && <LoadingSpinner />}
              </ErrorBoundary>
            </div>
          </div>
        ) : (
          // ── Landing mode ───────────────────────────────────────────────
          <div className="flex-1 overflow-y-auto">
            <LandingPage onImageData={handleImageData} />
          </div>
        )
      }
    />
  );
}
