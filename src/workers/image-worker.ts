// /// <reference lib="webworker" />
// // Makes `self` typed as DedicatedWorkerGlobalScope (not Window).

// import __wbg_init, {
//   apply_grayscale,
//   apply_invert,
//   apply_blur,
// } from '../../wasm-processor/pkg/wasm_processor.js';
// import type { WorkerIncomingMessage, WorkerOutgoingMessage } from '../types/image-worker.types';

// // Initialise the Wasm module once at worker startup.
// // vite-plugin-top-level-await handles the transpilation of this top-level await.
// await __wbg_init();

// self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
//   const { type, payload } = event.data;

//   if (type !== 'PROCESS_IMAGE') return;

//   try {
//     const { imageData, filter } = payload;

//     // Apply the selected filter directly on the ImageData's Uint8ClampedArray.
//     // wasm-bindgen copies the slice into Wasm linear memory, mutates it, then
//     // copies it back — one round-trip, no unsafe pointer arithmetic needed.
//     switch (filter) {
//       case 'grayscale':
//         apply_grayscale(imageData.data);
//         break;
//       case 'invert':
//         apply_invert(imageData.data);
//         break;
//       case 'blur':
//         apply_blur(imageData.data, imageData.width, imageData.height);
//         break;
//       default: {
//         // Exhaustiveness check — compile error if FilterType grows without updating this switch
//         const _exhaustive: never = filter;
//         throw new Error(`Unknown filter: ${String(_exhaustive)}`);
//       }
//     }

//     // ── Zero-Copy Transferable ────────────────────────────────────────────────
//     // Transfer ownership of the underlying ArrayBuffer back to the main thread.
//     // The main thread receives the data instantly with no structured-clone copy.
//     const response: WorkerOutgoingMessage = {
//       type: 'PROCESS_COMPLETE',
//       payload: { imageData },
//     };
//     self.postMessage(response, [imageData.data.buffer]);
//   } catch (err) {
//     const response: WorkerOutgoingMessage = {
//       type: 'PROCESS_ERROR',
//       payload: { error: err instanceof Error ? err.message : String(err) },
//     };
//     self.postMessage(response);
//   }
// };

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
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
} from "../types/image-worker.types";

// Initialise the Wasm module once at worker startup.
// vite-plugin-top-level-await handles the transpilation of this top-level await.
await __wbg_init();

self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;

  if (type !== "PROCESS_IMAGE") return;

  try {
    const { imageData, filter, parameter } = payload;

    // ── THE FIX: Create a standard array view over the memory buffer ──────────
    // Rust expects a Uint8Array, but imageData.data is a Uint8ClampedArray.
    // By creating a new view over the exact same buffer, we satisfy TypeScript
    // without copying any data or losing performance.
    const uint8View = new Uint8Array(imageData.data.buffer);
    // ──────────────────────────────────────────────────────────────────────────

    // ── Performance Telemetry ─────────────────────────────────────────────────
    // performance.now() is available natively in Worker scope (no import needed).
    const t0 = performance.now();

    // Convert the 0-100 UI parameter to the appropriate Rust argument per filter.
    // "Zero-to-full" filters (grayscale, invert, sepia, sharpen, sobel): default 100 → 1.0
    const intensity = (parameter ?? 100) / 100.0;
    // "Centered-at-50" filters (brightness, contrast, saturation): default 50 → 0.5 = no change
    const level = (parameter ?? 50) / 100.0;

    // Apply the selected filter directly on the memory view.
    switch (filter) {
      case "grayscale":
        apply_grayscale(uint8View, intensity);
        break;
      case "invert":
        apply_invert(uint8View, intensity);
        break;
      case "blur":
        apply_blur(uint8View, imageData.width, imageData.height, parameter ?? 10);
        break;
      case "brightness":
        apply_brightness(uint8View, level);
        break;
      case "contrast":
        apply_contrast(uint8View, level);
        break;
      case "sepia":
        apply_sepia(uint8View, intensity);
        break;
      case "saturation":
        apply_saturation(uint8View, level);
        break;
      case "sharpen":
        apply_sharpen(uint8View, imageData.width, imageData.height, intensity);
        break;
      case "sobel":
        apply_sobel_edge_detection(uint8View, imageData.width, imageData.height, intensity);
        break;
      default: {
        const _exhaustive: never = filter;
        throw new Error(`Unknown filter: ${String(_exhaustive)}`);
      }
    }

    const processingTimeMs = performance.now() - t0;

    // ── Zero-Copy Transferable ────────────────────────────────────────────────
    // Transfer ownership of the underlying ArrayBuffer back to the main thread.
    // The main thread receives the data instantly with no structured-clone copy.
    const response: WorkerOutgoingMessage = {
      type: "PROCESS_COMPLETE",
      payload: { imageData, processingTimeMs },
    };
    self.postMessage(response, [imageData.data.buffer]);
  } catch (err) {
    const response: WorkerOutgoingMessage = {
      type: "PROCESS_ERROR",
      payload: { error: err instanceof Error ? err.message : String(err) },
    };
    self.postMessage(response);
  }
};
