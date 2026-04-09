import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "../store/use-editor-store";
import type {
  FilterLayer,
  WorkerOutgoingMessage,
} from "../types/image-worker.types";

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  // Map<imageId, blobUrl> — tracks all live processed URLs so we can revoke by id
  const processedUrlMapRef = useRef<Map<string, string>>(new Map());
  // The onComplete callback supplied by the caller for the current in-flight request
  const onCompleteRef = useRef<((url: string, ms: number) => void) | null>(null);

  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setWorkerError = useEditorStore((s) => s.setWorkerError);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/image-worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = async (event: MessageEvent<WorkerOutgoingMessage>) => {
      const { type, payload } = event.data;

      if (type === "PROCESS_COMPLETE") {
        const { imageData } = payload;
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          return;
        }
        ctx.putImageData(imageData, 0, 0);
        const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
        const url = URL.createObjectURL(blob);

        setWorkerError(null);
        onCompleteRef.current?.(url, payload.processingTimeMs);
        onCompleteRef.current = null;
      } else {
        setWorkerError(payload.error);
        onCompleteRef.current = null;
      }

      setIsProcessing(false);
    };

    worker.onerror = (err) => {
      setWorkerError(err.message ?? "Worker failed to load");
      setIsProcessing(false);
      onCompleteRef.current = null;
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      // Revoke all tracked processed URLs on unmount
      for (const url of processedUrlMapRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      processedUrlMapRef.current.clear();
    };
  }, [setIsProcessing, setWorkerError]);

  /**
   * Process the full filter stack against the original ImageData.
   * A clone of the ImageData is transferred to the worker (zero-copy) so the
   * caller's cached original is never mutated or detached.
   *
   * @param imageData - The source ImageData to process
   * @param filterStack - Ordered list of filters to apply
   * @param imageId - The BatchImage id this result belongs to
   * @param onComplete - Called with (blobUrl, processingTimeMs) when the worker finishes
   */
  const processStack = useCallback(
    (
      imageData: ImageData,
      filterStack: FilterLayer[],
      imageId: string,
      onComplete: (url: string, ms: number) => void,
    ) => {
      if (!workerRef.current) return;
      setWorkerError(null);
      setIsProcessing(true);

      // Wrap onComplete to handle per-image URL lifecycle:
      // revoke the old processed URL for this specific image before delivering the new one
      onCompleteRef.current = (url: string, ms: number) => {
        const oldUrl = processedUrlMapRef.current.get(imageId);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        processedUrlMapRef.current.set(imageId, url);
        onComplete(url, ms);
      };

      const cloned = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      );

      workerRef.current.postMessage(
        { type: "PROCESS_IMAGE", payload: { imageData: cloned, filterStack } },
        [cloned.data.buffer],
      );
    },
    [setIsProcessing, setWorkerError],
  );

  /** Revoke the processed blob URL for a specific image (call before removeImage). */
  const revokeProcessedUrl = useCallback((imageId: string) => {
    const url = processedUrlMapRef.current.get(imageId);
    if (url) {
      URL.revokeObjectURL(url);
      processedUrlMapRef.current.delete(imageId);
    }
  }, []);

  /** Revoke all tracked processed URLs (call before reset). */
  const revokeAllProcessedUrls = useCallback(() => {
    for (const url of processedUrlMapRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    processedUrlMapRef.current.clear();
  }, []);

  return { processStack, revokeProcessedUrl, revokeAllProcessedUrls };
}
