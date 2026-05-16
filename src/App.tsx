import { useRef, useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useImageWorker } from "./hooks/use-image-worker";
import { useBatchExport } from "./hooks/use-batch-export";
import { useEditorStore, selectActiveImage } from "./store/use-editor-store";
import { fileToImageData } from "./utils/file-to-image-data";
import { EditorLayout } from "./components/EditorLayout";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { TopActionBar } from "./components/TopActionBar";
import type { ViewMode } from "./components/TopActionBar";
import type { ExportConfig } from "./components/ExportSettingsModal";
import { formatToExtension } from "./utils/resize-and-encode";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Filmstrip } from "./components/Filmstrip";
import { BatchProgressOverlay } from "./components/BatchProgressOverlay";
import { BetaBanner } from "./components/BetaBanner";

export default function App() {
  const { processStack, revokeProcessedUrl, revokeAllProcessedUrls } =
    useImageWorker();
  const { runBatchExport, processImageAsync } = useBatchExport();

  // Active image's decoded ImageData — one image at a time (no map, prevents OOM)
  const activeImageDataRef = useRef<ImageData | null>(null);
  // Track which image id is currently decoded to avoid re-decoding on slider drag
  const currentDecodedIdRef = useRef<string | null>(null);

  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isComparing, setIsComparing] = useState(false);
  // Once true, the editor UI is always shown — cleared only by handleExitEditor
  const [hasEnteredEditor, setHasEnteredEditor] = useState(false);

  const isProcessing = useEditorStore((s) => s.isProcessing);
  const isBatchExporting = useEditorStore((s) => s.isBatchExporting);
  const batchProgress = useEditorStore((s) => s.batchProgress);
  const images = useEditorStore((s) => s.images);
  const activeImageId = useEditorStore((s) => s.activeImageId);
  const filterStack = useEditorStore((s) => s.filterStack);
  const activeImage = useEditorStore(selectActiveImage);

  const addImages = useEditorStore((s) => s.addImages);
  const removeImage = useEditorStore((s) => s.removeImage);
  const setActiveImage = useEditorStore((s) => s.setActiveImage);
  const setActiveImageProcessedUrl = useEditorStore(
    (s) => s.setActiveImageProcessedUrl,
  );
  const setProcessingTimeMs = useEditorStore((s) => s.setProcessingTimeMs);
  const clearStack = useEditorStore((s) => s.clearStack);
  const reset = useEditorStore((s) => s.reset);

  const hasImage = images.length > 0;

  // ── Reactive pipeline ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeImageId || !activeImage) return;

    if (filterStack.length === 0) {
      revokeProcessedUrl(activeImageId);
      setActiveImageProcessedUrl(activeImageId, null);
      setProcessingTimeMs(null);
      return;
    }

    const run = async () => {
      if (activeImageId !== currentDecodedIdRef.current) {
        const imageData = await fileToImageData(activeImage.file);
        activeImageDataRef.current = imageData;
        currentDecodedIdRef.current = activeImageId;
      }

      if (!activeImageDataRef.current) return;

      processStack(
        activeImageDataRef.current,
        filterStack,
        activeImageId,
        (url, ms) => {
          setActiveImageProcessedUrl(activeImageId, url);
          setProcessingTimeMs(ms);
        },
      );
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStack, activeImageId]);

  // ── Add images ─────────────────────────────────────────────────────────────
  const handleAddImages = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      addImages(files);
      setHasEnteredEditor(true);
    },
    [addImages],
  );

  // ── Remove image from filmstrip ────────────────────────────────────────────
  const handleRemoveImage = useCallback(
    (id: string) => {
      revokeProcessedUrl(id);
      removeImage(id);
      if (id === currentDecodedIdRef.current) {
        activeImageDataRef.current = null;
        currentDecodedIdRef.current = null;
      }
    },
    [revokeProcessedUrl, removeImage],
  );

  // ── Reset filter stack, keep images ───────────────────────────────────────
  const handleReset = useCallback(() => {
    if (activeImageId) {
      revokeProcessedUrl(activeImageId);
      setActiveImageProcessedUrl(activeImageId, null);
    }
    clearStack();
  }, [
    activeImageId,
    revokeProcessedUrl,
    setActiveImageProcessedUrl,
    clearStack,
  ]);

  // ── Clear workspace — dumps all images but KEEPS editor open ──────────────
  const handleClearWorkspace = useCallback(() => {
    revokeAllProcessedUrls();
    activeImageDataRef.current = null;
    currentDecodedIdRef.current = null;
    reset();
    // hasEnteredEditor stays true — canvas shows the in-canvas dropzone
  }, [revokeAllProcessedUrls, reset]);

  // ── Exit editor — clears workspace AND returns to LandingPage ─────────────
  const handleExitEditor = useCallback(() => {
    handleClearWorkspace();
    setHasEnteredEditor(false);
  }, [handleClearWorkspace]);

  // ── Export active image ────────────────────────────────────────────────────
  const handleExport = useCallback(
    async (config: ExportConfig) => {
      if (!activeImage || !activeImageDataRef.current) return;
      setIsExportingSingle(true);
      try {
        const currentStack = useEditorStore.getState().filterStack;
        const blob = await processImageAsync(
          activeImageDataRef.current,
          currentStack,
          config,
        );
        const baseName = activeImage.file.name.replace(/\.[^.]+$/, "");
        const filename = `edited-${baseName}${formatToExtension(config.format)}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        useEditorStore
          .getState()
          .setWorkerError(err instanceof Error ? err.message : "Export failed");
      } finally {
        setIsExportingSingle(false);
      }
    },
    [activeImage, processImageAsync],
  );

  // ── Unsaved-work guard ────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (images.length === 0) return;
      e.preventDefault();
      e.returnValue = ""; // This line for Safari/Chrome compatibility
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [images.length]);

  // ── History API ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasEnteredEditor && window.location.hash === "#editor") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasEnteredEditor)
      window.history.pushState({ view: "editor" }, "", "#editor");
  }, [hasEnteredEditor]);

  useEffect(() => {
    const onPopState = () => {
      if (hasEnteredEditor) handleExitEditor();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasEnteredEditor, handleExitEditor]);

  return (
    <div className="flex flex-col h-dvh">
      <BetaBanner />
      <div className="flex flex-col flex-1 min-h-0">
      <EditorLayout
        hasImage={hasEnteredEditor}
        sidebar={<Sidebar hasImage={hasImage} />}
        main={
          hasEnteredEditor ? (
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

              <TopActionBar
                isProcessing={isProcessing}
                isBatchExporting={isBatchExporting}
                isExportingSingle={isExportingSingle}
                hasProcessed={!!activeImage?.processedUrl}
                imageCount={images.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddImages={handleAddImages}
                onReset={handleReset}
                onClearAll={handleClearWorkspace}
                onCompareStart={() => setIsComparing(true)}
                onCompareEnd={() => setIsComparing(false)}
                onExport={handleExport}
                onBatchExport={runBatchExport}
              />

              <div className="relative flex-1 overflow-hidden min-h-0 rounded-2xl border border-border-subtle bg-surface-overlay shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)]">
                <ErrorBoundary onReset={handleExitEditor}>
                  <Canvas
                    viewMode={viewMode}
                    isComparing={isComparing}
                    onFiles={handleAddImages}
                  />
                  {isProcessing && <LoadingSpinner />}
                </ErrorBoundary>
              </div>

              {/* Filmstrip — shown whenever images are loaded */}
              {images.length > 0 && (
                <Filmstrip
                  images={images}
                  activeImageId={activeImageId}
                  onSelect={setActiveImage}
                  onRemove={handleRemoveImage}
                  onAddImages={handleAddImages}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <LandingPage onFiles={handleAddImages} />
            </div>
          )
        }
      />

      </div>

      {/* Batch progress overlay — covers entire viewport */}
      {isBatchExporting && batchProgress && (
        <BatchProgressOverlay
          current={batchProgress.current}
          total={batchProgress.total}
        />
      )}
    </div>
  );
}
