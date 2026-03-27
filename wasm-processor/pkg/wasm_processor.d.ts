/* tslint:disable */
/* eslint-disable */

/**
 * Applies a 3×3 box blur to RGBA image data in place.
 * Allocates a separate source buffer to avoid read-write corruption during the pass.
 * Border pixels use clamped neighbor coordinates.
 */
export function apply_blur(data: Uint8Array, width: number, height: number): void;

/**
 * Converts RGBA image data to grayscale in place.
 * Uses ITU-R BT.601 luminance coefficients for perceptually correct output.
 */
export function apply_grayscale(data: Uint8Array): void;

/**
 * Inverts each RGB channel in place. Alpha channel is preserved.
 */
export function apply_invert(data: Uint8Array): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly apply_blur: (a: number, b: number, c: any, d: number, e: number) => void;
    readonly apply_grayscale: (a: number, b: number, c: any) => void;
    readonly apply_invert: (a: number, b: number, c: any) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
