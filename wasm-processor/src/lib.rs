use wasm_bindgen::prelude::*;

/// Converts RGBA image data to grayscale in place, blended by intensity.
/// Uses ITU-R BT.601 luminance coefficients for perceptually correct output.
/// intensity 0.0 = original, 1.0 = full grayscale.
#[wasm_bindgen]
pub fn apply_grayscale(data: &mut [u8], intensity: f32) {
    for pixel in data.chunks_exact_mut(4) {
        let gray = 0.299 * pixel[0] as f32
            + 0.587 * pixel[1] as f32
            + 0.114 * pixel[2] as f32;
        pixel[0] = (pixel[0] as f32 + (gray - pixel[0] as f32) * intensity) as u8;
        pixel[1] = (pixel[1] as f32 + (gray - pixel[1] as f32) * intensity) as u8;
        pixel[2] = (pixel[2] as f32 + (gray - pixel[2] as f32) * intensity) as u8;
        // pixel[3] (alpha) is unchanged
    }
}

/// Inverts each RGB channel in place, blended by intensity.
/// intensity 0.0 = original, 1.0 = full invert.
#[wasm_bindgen]
pub fn apply_invert(data: &mut [u8], intensity: f32) {
    for pixel in data.chunks_exact_mut(4) {
        let inv_r = 255.0 - pixel[0] as f32;
        let inv_g = 255.0 - pixel[1] as f32;
        let inv_b = 255.0 - pixel[2] as f32;
        pixel[0] = (pixel[0] as f32 + (inv_r - pixel[0] as f32) * intensity) as u8;
        pixel[1] = (pixel[1] as f32 + (inv_g - pixel[1] as f32) * intensity) as u8;
        pixel[2] = (pixel[2] as f32 + (inv_b - pixel[2] as f32) * intensity) as u8;
        // alpha unchanged
    }
}

/// Adjusts brightness of RGBA image data in place.
/// intensity 0.0 = full dark, 0.5 = no change, 1.0 = full bright.
/// Zero-alloc — operates entirely on the incoming slice.
#[wasm_bindgen]
pub fn apply_brightness(data: &mut [u8], intensity: f32) {
    let bias = (intensity * 2.0 - 1.0) * 255.0;
    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        pixel[0] = (r + bias).clamp(0.0, 255.0) as u8;
        pixel[1] = (g + bias).clamp(0.0, 255.0) as u8;
        pixel[2] = (b + bias).clamp(0.0, 255.0) as u8;
        // pixel[3] (alpha) NEVER TOUCHED
    }
}

/// Adjusts contrast of RGBA image data in place.
/// intensity 0.0 = flat gray, 0.5 = no change, 1.0 = maximum contrast.
/// Zero-alloc. All arithmetic on f32 — no u8 underflow risk.
#[wasm_bindgen]
pub fn apply_contrast(data: &mut [u8], intensity: f32) {
    let factor = if intensity <= 0.5 {
        intensity * 2.0
    } else {
        1.0 + (intensity - 0.5) * 4.0
    };
    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        pixel[0] = ((r - 128.0) * factor + 128.0).clamp(0.0, 255.0) as u8;
        pixel[1] = ((g - 128.0) * factor + 128.0).clamp(0.0, 255.0) as u8;
        pixel[2] = ((b - 128.0) * factor + 128.0).clamp(0.0, 255.0) as u8;
        // pixel[3] (alpha) NEVER TOUCHED
    }
}

/// Applies sepia tone to RGBA image data in place, blended by intensity.
/// intensity 0.0 = original, 1.0 = full sepia.
/// Zero-alloc — standard sepia color matrix with lerp.
#[wasm_bindgen]
pub fn apply_sepia(data: &mut [u8], intensity: f32) {
    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        let tr = (0.393 * r + 0.769 * g + 0.189 * b).min(255.0);
        let tg = (0.349 * r + 0.686 * g + 0.168 * b).min(255.0);
        let tb = (0.272 * r + 0.534 * g + 0.131 * b).min(255.0);
        pixel[0] = (r + (tr - r) * intensity) as u8;
        pixel[1] = (g + (tg - g) * intensity) as u8;
        pixel[2] = (b + (tb - b) * intensity) as u8;
        // pixel[3] (alpha) NEVER TOUCHED
    }
}

/// Adjusts saturation of RGBA image data in place.
/// level 0.0 = fully desaturated (gray), 0.5 = original, 1.0 = 2× oversaturated.
/// Zero-alloc. Uses BT.601 luminance for grayscale reference.
#[wasm_bindgen]
pub fn apply_saturation(data: &mut [u8], level: f32) {
    let factor = level * 2.0;
    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        pixel[0] = (gray + (r - gray) * factor).clamp(0.0, 255.0) as u8;
        pixel[1] = (gray + (g - gray) * factor).clamp(0.0, 255.0) as u8;
        pixel[2] = (gray + (b - gray) * factor).clamp(0.0, 255.0) as u8;
        // pixel[3] (alpha) NEVER TOUCHED
    }
}

/// Applies a 3×3 sharpening convolution kernel, blended by intensity.
/// Kernel: [0,-1,0; -1,5,-1; 0,-1,0].
/// intensity 0.0 = original, 1.0 = full sharpen.
/// Allocates a single source-buffer copy upfront. Border pixels are untouched.
#[wasm_bindgen]
pub fn apply_sharpen(data: &mut [u8], width: u32, height: u32, intensity: f32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();

    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let idx = (y * w + x) * 4;
            for c in 0..3_usize {
                let center = src[idx + c] as f32;
                let top    = src[((y - 1) * w + x) * 4 + c] as f32;
                let bottom = src[((y + 1) * w + x) * 4 + c] as f32;
                let left   = src[(y * w + (x - 1)) * 4 + c] as f32;
                let right  = src[(y * w + (x + 1)) * 4 + c] as f32;
                let sharp = (5.0 * center - top - bottom - left - right).clamp(0.0, 255.0);
                data[idx + c] = (center + (sharp - center) * intensity).clamp(0.0, 255.0) as u8;
            }
            // pixel[3] (alpha) NEVER TOUCHED
        }
    }
}

/// Applies Sobel edge detection, blended by intensity.
/// intensity 0.0 = original, 1.0 = full edge map (grayscale magnitude).
/// Allocates a single source-buffer copy upfront. Border pixels are untouched.
#[wasm_bindgen]
pub fn apply_sobel_edge_detection(data: &mut [u8], width: u32, height: u32, intensity: f32) {
    let w = width as usize;
    let h = height as usize;
    let src = data.to_vec();

    // Luminance from RGBA at a given (row, col) — reads from src, never from data.
    let lum = |yy: usize, xx: usize| -> f32 {
        let i = (yy * w + xx) * 4;
        0.299 * src[i] as f32 + 0.587 * src[i + 1] as f32 + 0.114 * src[i + 2] as f32
    };

    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            let idx = (y * w + x) * 4;

            // Sobel Gx: [-1,0,+1; -2,0,+2; -1,0,+1]
            let gx = -lum(y - 1, x - 1) + lum(y - 1, x + 1)
                   - 2.0 * lum(y, x - 1) + 2.0 * lum(y, x + 1)
                   - lum(y + 1, x - 1) + lum(y + 1, x + 1);

            // Sobel Gy: [-1,-2,-1; 0,0,0; +1,+2,+1]
            let gy = -lum(y - 1, x - 1) - 2.0 * lum(y - 1, x) - lum(y - 1, x + 1)
                   + lum(y + 1, x - 1) + 2.0 * lum(y + 1, x) + lum(y + 1, x + 1);

            let mag = (gx * gx + gy * gy).sqrt().min(255.0);

            for c in 0..3_usize {
                let orig = src[idx + c] as f32;
                data[idx + c] = (orig + (mag - orig) * intensity).clamp(0.0, 255.0) as u8;
            }
            // pixel[3] (alpha) NEVER TOUCHED
        }
    }
}

/// Applies a large-radius box blur using an optimised two-pass (horizontal then
/// vertical) sliding-window algorithm.
///
/// Complexity: O(width × height) — independent of radius, unlike the naïve
/// O(width × height × radius²) nested-loop approach. A sliding window maintains
/// a running sum: when the window moves one pixel, subtract the outgoing left
/// pixel and add the incoming right pixel, making each pixel O(1) regardless of
/// how wide the kernel is.
///
/// Two passes (H then V) approximate a 2-D box blur accurately because a box
/// filter is separable: blur(H) ∘ blur(V) ≡ blur(2-D box).
#[wasm_bindgen]
pub fn apply_blur(data: &mut [u8], width: u32, height: u32, radius: u32) {
    let w = width as usize;
    let h = height as usize;
    let radius: usize = (radius as usize).max(1); // kernel half-width → full kernel = 2*radius+1
    let pixel_count = w * h * 4;

    // Work on u32 sums to avoid overflow (max sum per channel: 255 × 41 = 10 455 < 2^32)
    let mut tmp = vec![0u8; pixel_count];

    // ── Pass 1: horizontal blur ───────────────────────────────────────────────
    // For each row, slide a window of width (2*radius+1) across all columns.
    for y in 0..h {
        let row_off = y * w * 4;

        // Initialise the running sums for the first window.
        // Clamp: pixels left of x=0 are mirrored as the first pixel.
        let mut r_sum: u32 = 0;
        let mut g_sum: u32 = 0;
        let mut b_sum: u32 = 0;
        let mut a_sum: u32 = 0;
        let win = (2 * radius + 1) as u32;

        // Prime the window: accumulate pixels from x = 0..(radius+1), clamping
        // the left side to column 0.
        for kx in 0..=(radius) {
            // left half (clamped to column 0)
            let src_x_left = 0usize;
            let idx_l = row_off + src_x_left * 4;
            r_sum += data[idx_l] as u32;
            g_sum += data[idx_l + 1] as u32;
            b_sum += data[idx_l + 2] as u32;
            a_sum += data[idx_l + 3] as u32;
            let _ = kx; // used in loop bound
        }
        for kx in 1..=(radius) {
            let src_x_right = kx.min(w - 1);
            let idx_r = row_off + src_x_right * 4;
            r_sum += data[idx_r] as u32;
            g_sum += data[idx_r + 1] as u32;
            b_sum += data[idx_r + 2] as u32;
            a_sum += data[idx_r + 3] as u32;
        }

        for x in 0..w {
            // Write the average for this window position
            let out_idx = row_off + x * 4;
            tmp[out_idx]     = (r_sum / win) as u8;
            tmp[out_idx + 1] = (g_sum / win) as u8;
            tmp[out_idx + 2] = (b_sum / win) as u8;
            tmp[out_idx + 3] = (a_sum / win) as u8;

            // Slide: subtract the outgoing left pixel, add the incoming right pixel
            let out_x = if x + radius + 1 < w { x + radius + 1 } else { w - 1 };
            let in_x  = if x >= radius { x - radius } else { 0 };

            let idx_out = row_off + out_x * 4;
            r_sum += data[idx_out] as u32;
            g_sum += data[idx_out + 1] as u32;
            b_sum += data[idx_out + 2] as u32;
            a_sum += data[idx_out + 3] as u32;

            let idx_in = row_off + in_x * 4;
            r_sum -= data[idx_in] as u32;
            g_sum -= data[idx_in + 1] as u32;
            b_sum -= data[idx_in + 2] as u32;
            a_sum -= data[idx_in + 3] as u32;
        }
    }

    // ── Pass 2: vertical blur (reads from tmp, writes to data) ───────────────
    for x in 0..w {
        let mut r_sum: u32 = 0;
        let mut g_sum: u32 = 0;
        let mut b_sum: u32 = 0;
        let mut a_sum: u32 = 0;
        let win = (2 * radius + 1) as u32;

        // Prime with the top (radius+1) rows, clamping to row 0 on the top edge
        for _ in 0..=(radius) {
            let idx = 0 * w * 4 + x * 4; // row 0
            r_sum += tmp[idx] as u32;
            g_sum += tmp[idx + 1] as u32;
            b_sum += tmp[idx + 2] as u32;
            a_sum += tmp[idx + 3] as u32;
        }
        for ky in 1..=(radius) {
            let src_y = ky.min(h - 1);
            let idx = src_y * w * 4 + x * 4;
            r_sum += tmp[idx] as u32;
            g_sum += tmp[idx + 1] as u32;
            b_sum += tmp[idx + 2] as u32;
            a_sum += tmp[idx + 3] as u32;
        }

        for y in 0..h {
            let out_idx = y * w * 4 + x * 4;
            data[out_idx]     = (r_sum / win) as u8;
            data[out_idx + 1] = (g_sum / win) as u8;
            data[out_idx + 2] = (b_sum / win) as u8;
            data[out_idx + 3] = (a_sum / win) as u8;

            let out_y = if y + radius + 1 < h { y + radius + 1 } else { h - 1 };
            let in_y  = if y >= radius { y - radius } else { 0 };

            let idx_out = out_y * w * 4 + x * 4;
            r_sum += tmp[idx_out] as u32;
            g_sum += tmp[idx_out + 1] as u32;
            b_sum += tmp[idx_out + 2] as u32;
            a_sum += tmp[idx_out + 3] as u32;

            let idx_in = in_y * w * 4 + x * 4;
            r_sum -= tmp[idx_in] as u32;
            g_sum -= tmp[idx_in + 1] as u32;
            b_sum -= tmp[idx_in + 2] as u32;
            a_sum -= tmp[idx_in + 3] as u32;
        }
    }
}
