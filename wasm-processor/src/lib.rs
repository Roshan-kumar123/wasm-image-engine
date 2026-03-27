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

/// Applies a 3×3 box blur to RGBA image data in place.
/// Allocates a separate source buffer to avoid read-write corruption during the pass.
/// Border pixels use clamped neighbor coordinates.
#[wasm_bindgen]
pub fn apply_blur(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    // Clone the source so we can read clean values while writing blurred output
    let src = data.to_vec();

    for y in 0..h {
        for x in 0..w {
            let mut r: u32 = 0;
            let mut g: u32 = 0;
            let mut b: u32 = 0;
            let mut count: u32 = 0;

            // 3×3 kernel — skip out-of-bounds neighbours
            for ky in 0usize..3 {
                for kx in 0usize..3 {
                    // Shift so the kernel is centred on (x, y)
                    let nx = x + kx;
                    let ny = y + ky;
                    if nx == 0 || ny == 0 {
                        continue;
                    }
                    let nx = nx - 1;
                    let ny = ny - 1;
                    if nx >= w || ny >= h {
                        continue;
                    }
                    let idx = (ny * w + nx) * 4;
                    r += src[idx] as u32;
                    g += src[idx + 1] as u32;
                    b += src[idx + 2] as u32;
                    count += 1;
                }
            }

            let idx = (y * w + x) * 4;
            if count > 0 {
                data[idx] = (r / count) as u8;
                data[idx + 1] = (g / count) as u8;
                data[idx + 2] = (b / count) as u8;
            }
            // Preserve alpha channel
            data[idx + 3] = src[idx + 3];
        }
    }
}
