use wasm_bindgen::prelude::*;

/// Converts RGBA image data to grayscale in place.
/// Uses ITU-R BT.601 luminance coefficients for perceptually correct output.
#[wasm_bindgen]
pub fn apply_grayscale(data: &mut [u8]) {
    for pixel in data.chunks_exact_mut(4) {
        let gray = (0.299 * pixel[0] as f32
            + 0.587 * pixel[1] as f32
            + 0.114 * pixel[2] as f32) as u8;
        pixel[0] = gray;
        pixel[1] = gray;
        pixel[2] = gray;
        // pixel[3] (alpha) is unchanged
    }
}

/// Inverts each RGB channel in place. Alpha channel is preserved.
#[wasm_bindgen]
pub fn apply_invert(data: &mut [u8]) {
    for pixel in data.chunks_exact_mut(4) {
        pixel[0] = 255 - pixel[0];
        pixel[1] = 255 - pixel[1];
        pixel[2] = 255 - pixel[2];
        // alpha unchanged
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
pub fn apply_blur(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let radius: usize = 10; // kernel half-width → full kernel = 2*radius+1 = 21 px wide
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
