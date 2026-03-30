/* tslint:disable */
/* eslint-disable */

/**
 * Applies a large-radius box blur using an optimised two-pass (horizontal then
 * vertical) sliding-window algorithm.
 *
 * Complexity: O(width × height) — independent of radius, unlike the naïve
 * O(width × height × radius²) nested-loop approach. A sliding window maintains
 * a running sum: when the window moves one pixel, subtract the outgoing left
 * pixel and add the incoming right pixel, making each pixel O(1) regardless of
 * how wide the kernel is.
 *
 * Two passes (H then V) approximate a 2-D box blur accurately because a box
 * filter is separable: blur(H) ∘ blur(V) ≡ blur(2-D box).
 */
export function apply_blur(data: Uint8Array, width: number, height: number, radius: number): void;

/**
 * Converts RGBA image data to grayscale in place, blended by intensity.
 * Uses ITU-R BT.601 luminance coefficients for perceptually correct output.
 * intensity 0.0 = original, 1.0 = full grayscale.
 */
export function apply_grayscale(data: Uint8Array, intensity: number): void;

/**
 * Inverts each RGB channel in place, blended by intensity.
 * intensity 0.0 = original, 1.0 = full invert.
 */
export function apply_invert(data: Uint8Array, intensity: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly apply_blur: (a: number, b: number, c: any, d: number, e: number, f: number) => void;
    readonly apply_grayscale: (a: number, b: number, c: any, d: number) => void;
    readonly apply_invert: (a: number, b: number, c: any, d: number) => void;
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
