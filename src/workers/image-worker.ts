/// <reference lib="webworker" />
// Makes `self` typed as DedicatedWorkerGlobalScope (not Window).

import __wbg_init, {
  apply_grayscale,
  apply_invert,
  apply_blur,
} from '../../wasm-processor/pkg/wasm_processor.js';
import type { WorkerIncomingMessage, WorkerOutgoingMessage } from '../types/image-worker.types';

// Initialise the Wasm module once at worker startup.
// vite-plugin-top-level-await handles the transpilation of this top-level await.
await __wbg_init();

self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;

  if (type !== 'PROCESS_IMAGE') return;

  try {
    const { imageData, filter } = payload;

    // Apply the selected filter directly on the ImageData's Uint8ClampedArray.
    // wasm-bindgen copies the slice into Wasm linear memory, mutates it, then
    // copies it back — one round-trip, no unsafe pointer arithmetic needed.
    switch (filter) {
      case 'grayscale':
        apply_grayscale(imageData.data);
        break;
      case 'invert':
        apply_invert(imageData.data);
        break;
      case 'blur':
        apply_blur(imageData.data, imageData.width, imageData.height);
        break;
      default: {
        // Exhaustiveness check — compile error if FilterType grows without updating this switch
        const _exhaustive: never = filter;
        throw new Error(`Unknown filter: ${String(_exhaustive)}`);
      }
    }

    // ── Zero-Copy Transferable ────────────────────────────────────────────────
    // Transfer ownership of the underlying ArrayBuffer back to the main thread.
    // The main thread receives the data instantly with no structured-clone copy.
    const response: WorkerOutgoingMessage = {
      type: 'PROCESS_COMPLETE',
      payload: { imageData },
    };
    self.postMessage(response, [imageData.data.buffer]);
  } catch (err) {
    const response: WorkerOutgoingMessage = {
      type: 'PROCESS_ERROR',
      payload: { error: err instanceof Error ? err.message : String(err) },
    };
    self.postMessage(response);
  }
};
