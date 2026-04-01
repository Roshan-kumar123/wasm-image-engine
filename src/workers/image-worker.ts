/// <reference lib="webworker" />
// Makes `self` typed as DedicatedWorkerGlobalScope (not Window).

import __wbg_init, {
  apply_grayscale,
  apply_invert,
  apply_blur,
  apply_brightness,
  apply_contrast,
  apply_sepia,
  apply_saturation,
  apply_sharpen,
  apply_sobel_edge_detection,
} from "../../wasm-processor/pkg/wasm_processor.js";
import type {
  FilterType,
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
} from "../types/image-worker.types";

await __wbg_init();

// ── Apply a single filter layer to a Uint8Array buffer in-place ──────────────
function applyFilter(
  buf: Uint8Array,
  width: number,
  height: number,
  type: FilterType,
  value: number,
): void {
  // "Zero-to-full" filters (grayscale, invert, sepia, sharpen, sobel):
  // UI 0-100 → Rust 0.0-1.0, default 100 → 1.0
  const intensity = value / 100.0;
  // "Centered-at-50" filters (brightness, contrast, saturation):
  // UI 0-100 → Rust 0.0-1.0 where 0.5 = no change
  const level = value / 100.0;

  switch (type) {
    case "grayscale":
      apply_grayscale(buf, intensity);
      break;
    case "invert":
      apply_invert(buf, intensity);
      break;
    case "blur":
      apply_blur(buf, width, height, value);  // raw radius, not normalised
      break;
    case "brightness":
      apply_brightness(buf, level);
      break;
    case "contrast":
      apply_contrast(buf, level);
      break;
    case "sepia":
      apply_sepia(buf, intensity);
      break;
    case "saturation":
      apply_saturation(buf, level);
      break;
    case "sharpen":
      apply_sharpen(buf, width, height, intensity);
      break;
    case "sobel":
      apply_sobel_edge_detection(buf, width, height, intensity);
      break;
    default: {
      // Exhaustiveness check — compile error if FilterType grows without updating this switch
      const _exhaustive: never = type;
      throw new Error(`Unknown filter: ${String(_exhaustive)}`);
    }
  }
}

self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;
  if (type !== "PROCESS_IMAGE") return;

  try {
    const { imageData, filterStack } = payload;
    const { width, height } = imageData;

    // ── Pipeline ──────────────────────────────────────────────────────────────
    // The ImageData buffer arrived via Transferable — we own it exclusively.
    // Create a Uint8Array view (Rust expects Uint8Array, not Uint8ClampedArray).
    const buf = new Uint8Array(imageData.data.buffer);

    const t0 = performance.now();

    // Apply each layer in order. Each call mutates `buf` in-place, so the output
    // of layer N becomes the input of layer N+1 automatically — no extra copies.
    for (const layer of filterStack) {
      applyFilter(buf, width, height, layer.type, layer.value);
    }

    const processingTimeMs = performance.now() - t0;

    const response: WorkerOutgoingMessage = {
      type: "PROCESS_COMPLETE",
      payload: { imageData, processingTimeMs },
    };
    // Transfer the buffer back to the main thread — zero structured-clone cost.
    self.postMessage(response, [imageData.data.buffer]);
  } catch (err) {
    const response: WorkerOutgoingMessage = {
      type: "PROCESS_ERROR",
      payload: { error: err instanceof Error ? err.message : String(err) },
    };
    self.postMessage(response);
  }
};
