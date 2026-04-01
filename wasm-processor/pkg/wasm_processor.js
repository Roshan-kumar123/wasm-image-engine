/* @ts-self-types="./wasm_processor.d.ts" */

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
 * @param {Uint8Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
export function apply_blur(data, width, height, radius) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_blur(ptr0, len0, data, width, height, radius);
}

/**
 * Adjusts brightness of RGBA image data in place.
 * intensity 0.0 = full dark, 0.5 = no change, 1.0 = full bright.
 * Zero-alloc — operates entirely on the incoming slice.
 * @param {Uint8Array} data
 * @param {number} intensity
 */
export function apply_brightness(data, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_brightness(ptr0, len0, data, intensity);
}

/**
 * Adjusts contrast of RGBA image data in place.
 * intensity 0.0 = flat gray, 0.5 = no change, 1.0 = maximum contrast.
 * Zero-alloc. All arithmetic on f32 — no u8 underflow risk.
 * @param {Uint8Array} data
 * @param {number} intensity
 */
export function apply_contrast(data, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_contrast(ptr0, len0, data, intensity);
}

/**
 * Converts RGBA image data to grayscale in place, blended by intensity.
 * Uses ITU-R BT.601 luminance coefficients for perceptually correct output.
 * intensity 0.0 = original, 1.0 = full grayscale.
 * @param {Uint8Array} data
 * @param {number} intensity
 */
export function apply_grayscale(data, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_grayscale(ptr0, len0, data, intensity);
}

/**
 * Inverts each RGB channel in place, blended by intensity.
 * intensity 0.0 = original, 1.0 = full invert.
 * @param {Uint8Array} data
 * @param {number} intensity
 */
export function apply_invert(data, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_invert(ptr0, len0, data, intensity);
}

/**
 * Adjusts saturation of RGBA image data in place.
 * level 0.0 = fully desaturated (gray), 0.5 = original, 1.0 = 2× oversaturated.
 * Zero-alloc. Uses BT.601 luminance for grayscale reference.
 * @param {Uint8Array} data
 * @param {number} level
 */
export function apply_saturation(data, level) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_saturation(ptr0, len0, data, level);
}

/**
 * Applies sepia tone to RGBA image data in place, blended by intensity.
 * intensity 0.0 = original, 1.0 = full sepia.
 * Zero-alloc — standard sepia color matrix with lerp.
 * @param {Uint8Array} data
 * @param {number} intensity
 */
export function apply_sepia(data, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_sepia(ptr0, len0, data, intensity);
}

/**
 * Applies a 3×3 sharpening convolution kernel, blended by intensity.
 * Kernel: [0,-1,0; -1,5,-1; 0,-1,0].
 * intensity 0.0 = original, 1.0 = full sharpen.
 * Allocates a single source-buffer copy upfront. Border pixels are untouched.
 * @param {Uint8Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} intensity
 */
export function apply_sharpen(data, width, height, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_sharpen(ptr0, len0, data, width, height, intensity);
}

/**
 * Applies Sobel edge detection, blended by intensity.
 * intensity 0.0 = original, 1.0 = full edge map (grayscale magnitude).
 * Allocates a single source-buffer copy upfront. Border pixels are untouched.
 * @param {Uint8Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} intensity
 */
export function apply_sobel_edge_detection(data, width, height, intensity) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.apply_sobel_edge_detection(ptr0, len0, data, width, height, intensity);
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_d2f20acdab8e0740: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./wasm_processor_bg.js": import0,
    };
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('wasm_processor_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
