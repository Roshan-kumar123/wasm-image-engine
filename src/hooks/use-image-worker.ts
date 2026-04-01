import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "../store/use-editor-store";
import type {
  FilterLayer,
  WorkerOutgoingMessage,
} from "../types/image-worker.types";

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const setProcessedImageUrl = useEditorStore((s) => s.setProcessedImageUrl);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const setWorkerError = useEditorStore((s) => s.setWorkerError);
  const setProcessingTimeMs = useEditorStore((s) => s.setProcessingTimeMs);

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

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;

        setProcessedImageUrl(url);
        setProcessingTimeMs(payload.processingTimeMs);
        setWorkerError(null);
      } else {
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
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [setProcessedImageUrl, setIsProcessing, setWorkerError, setProcessingTimeMs]);

  // Process the full filter stack against the original ImageData.
  // A clone of the ImageData is transferred to the worker on every call so the
  // caller's cached original is never mutated or detached.
  const processStack = useCallback(
    (imageData: ImageData, filterStack: FilterLayer[]) => {
      if (!workerRef.current) return;
      setWorkerError(null);
      setIsProcessing(true);

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

  const revokeProcessedUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  return { processStack, revokeProcessedUrl };
}
