import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "../store/use-editor-store";
import type {
  FilterType,
  WorkerOutgoingMessage,
} from "../types/image-worker.types";

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  // Tracks the previous processed blob URL so we can revoke it before setting a new one
  const prevUrlRef = useRef<string | null>(null);

  const setProcessedImageUrl = useEditorStore((s) => s.setProcessedImageUrl);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setWorkerError = useEditorStore((s) => s.setWorkerError);
  const setProcessingTimeMs = useEditorStore((s) => s.setProcessingTimeMs);

  useEffect(() => {
    // new URL(..., import.meta.url) is the Vite-canonical pattern for worker bundling.
    // Vite detects this at build time and bundles the worker as a separate chunk.
    const worker = new Worker(
      new URL("../workers/image-worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = async (event: MessageEvent<WorkerOutgoingMessage>) => {
      const { type, payload } = event.data;

      if (type === "PROCESS_COMPLETE") {
        const { imageData } = payload;

        // Convert the processed ImageData → Blob → Object URL for display.
        // OffscreenCanvas is available in all modern browsers and worker contexts.
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          return;
        }
        ctx.putImageData(imageData, 0, 0);
        // const blob = await canvas.convertToBlob({ type: 'image/png' });

        // ── THE FIX: Compress back to JPEG ───────────────────────────────────
        // We use image/jpeg at 85% quality to prevent a massive file size spike
        // (e.g. keeping it around 2-3MB instead of inflating to 21MB as a PNG).
        const blob = await canvas.convertToBlob({
          type: "image/jpeg",
          quality: 0.85,
        });
        const url = URL.createObjectURL(blob);

        // Revoke the previous URL to release browser memory
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        prevUrlRef.current = url;

        setProcessedImageUrl(url);
        setProcessingTimeMs(payload.processingTimeMs);
        setWorkerError(null);
      } else {
        // PROCESS_ERROR
        setWorkerError(payload.error);
      }

      setIsProcessing(false);
    };

    worker.onerror = (err) => {
      setWorkerError(err.message ?? "Worker failed to load");
      setIsProcessing(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      // Clean up any outstanding blob URL when the component unmounts
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [setProcessedImageUrl, setIsProcessing, setWorkerError, setProcessingTimeMs]);

  const processImage = useCallback(
    (imageData: ImageData, filter: FilterType, parameter?: number) => {
      if (!workerRef.current) return;
      setWorkerError(null);
      setIsProcessing(true);

      // ── Zero-Copy Transferable ────────────────────────────────────────────
      // Clone the ImageData so the caller's cached copy is not affected by
      // the buffer transfer (transferred buffers become detached/zero-length).
      const cloned = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      );

      // Transfer ownership of the cloned buffer to the worker — zero structured-clone cost.
      workerRef.current.postMessage(
        { type: "PROCESS_IMAGE", payload: { imageData: cloned, filter, parameter } },
        [cloned.data.buffer],
      );
    },
    [setIsProcessing, setWorkerError],
  );

  const revokeProcessedUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  return { processImage, revokeProcessedUrl };
}
