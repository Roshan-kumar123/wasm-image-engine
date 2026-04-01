// Single source of truth for the postMessage protocol.
// Imported by both the Web Worker and the main-thread hook.

export type FilterType =
  | 'grayscale'
  | 'invert'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'sepia'
  | 'saturation'
  | 'sharpen'
  | 'sobel';

// ─── Filter stack layer (one entry per applied filter) ───────────────────────

export interface FilterLayer {
  id: string;       // unique per layer (crypto.randomUUID or nanoid)
  type: FilterType;
  value: number;    // UI parameter: 0-100 for most; 1-40 for blur; 0-100 for sharpen/sobel
}

// ─── Messages sent TO the worker ────────────────────────────────────────────

export interface ProcessImageMessage {
  type: 'PROCESS_IMAGE';
  payload: {
    imageData: ImageData;
    filterStack: FilterLayer[];   // ordered array — applied left to right
  };
}

export type WorkerIncomingMessage = ProcessImageMessage;

// ─── Messages sent FROM the worker ──────────────────────────────────────────

export interface ProcessCompleteMessage {
  type: 'PROCESS_COMPLETE';
  payload: {
    imageData: ImageData;
    processingTimeMs: number;
  };
}

export interface ProcessErrorMessage {
  type: 'PROCESS_ERROR';
  payload: {
    error: string;
  };
}

export type WorkerOutgoingMessage = ProcessCompleteMessage | ProcessErrorMessage;
