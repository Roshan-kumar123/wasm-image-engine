import { useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import { useEditorStore } from "../store/use-editor-store";
import { fileToImageData } from "../utils/file-to-image-data";
import { resizeAndEncode, formatToExtension } from "../utils/resize-and-encode";
import type { FilterLayer, WorkerOutgoingMessage } from "../types/image-worker.types";
import type { ExportConfig } from "../components/ExportSettingsModal";

/**
 * Batch export hook — owns a dedicated Worker separate from the live-preview worker.
 * Processes all images sequentially (one at a time) to prevent OOM on large batches.
 * Packages all results into a single "pixelflow-batch.zip" download via jszip.
 */
export function useBatchExport() {
  const workerRef = useRef<Worker | null>(null);

  // Lazy-init the dedicated batch worker
  const getWorker = (): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/image-worker.ts", import.meta.url),
        { type: "module" },
      );
    }
    return workerRef.current;
  };

  // Terminate the batch worker when the hook unmounts
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Promisified single-image processing via the batch worker.
   * Uses addEventListener (not onmessage assignment) so the handler is registered
   * and removed cleanly for each request without mutating the worker's onmessage slot.
   * Sequential calls are safe because each awaits completion before the next.
   */
  const processImageAsync = (
    imageData: ImageData,
    stack: FilterLayer[],
    config: ExportConfig,
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();

      const handleMessage = async (event: MessageEvent<WorkerOutgoingMessage>) => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);

        const { type, payload } = event.data;
        if (type === "PROCESS_COMPLETE") {
          try {
            const blob = await resizeAndEncode(payload.imageData, config);
            resolve(blob);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(payload.error));
        }
      };

      const handleError = (err: ErrorEvent) => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        reject(new Error(err.message ?? "Batch worker error"));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      const cloned = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      );
      worker.postMessage(
        { type: "PROCESS_IMAGE", payload: { imageData: cloned, filterStack: stack } },
        [cloned.data.buffer],
      );
    });
  };

  const runBatchExport = useCallback(async (config: ExportConfig) => {
    // Read latest state at call time (not stale hook closure values)
    const state = useEditorStore.getState();
    const { images: currentImages, filterStack: currentStack, isBatchExporting } = state;

    if (isBatchExporting || currentImages.length === 0) return;

    state.setBatchExporting(true);
    state.setBatchProgress({ current: 0, total: currentImages.length });

    const zip = new JSZip();

    try {
      for (let i = 0; i < currentImages.length; i++) {
        const image = currentImages[i];
        useEditorStore.getState().setBatchProgress({ current: i + 1, total: currentImages.length });

        // Fresh decode per image — no shared ImageData cache (prevents OOM on large batches)
        const imageData = await fileToImageData(image.file);
        const blob = await processImageAsync(imageData, currentStack, config);

        // Strip original extension and use the export format's extension
        const baseName = image.file.name.replace(/\.[^.]+$/, "");
        const filename = `${String(i + 1).padStart(3, "0")}_${baseName}${formatToExtension(config.format)}`;
        zip.file(filename, blob);

        useEditorStore.getState().setActiveImageExported(image.id);
      }

      // Generate and trigger download
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "pixelflow-batch.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      useEditorStore.getState().setWorkerError(
        err instanceof Error ? err.message : "Batch export failed",
      );
    } finally {
      useEditorStore.getState().setBatchExporting(false);
      useEditorStore.getState().setBatchProgress(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { runBatchExport, processImageAsync };
}
