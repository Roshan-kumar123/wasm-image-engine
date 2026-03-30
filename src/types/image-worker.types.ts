// Single source of truth for the postMessage protocol.
// Imported by both the Web Worker and the main-thread hook.

export type FilterType = 'grayscale' | 'invert' | 'blur';

// ─── Messages sent TO the worker ────────────────────────────────────────────

export interface ProcessImageMessage {
  type: 'PROCESS_IMAGE';
  payload: {
    imageData: ImageData;
    filter: FilterType;
    parameter?: number;
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
