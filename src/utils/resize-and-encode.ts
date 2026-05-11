import type { ExportConfig } from '../components/ExportSettingsModal';

function formatToMime(format: ExportConfig['format']): string {
  switch (format) {
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'png':  return 'image/png';
  }
}

export function formatToExtension(format: ExportConfig['format']): string {
  switch (format) {
    case 'jpeg': return '.jpg';
    case 'webp': return '.webp';
    case 'png':  return '.png';
  }
}

export async function resizeAndEncode(
  imageData: ImageData,
  config: ExportConfig,
): Promise<Blob> {
  const srcW = imageData.width;
  const srcH = imageData.height;

  const scaleW = config.maxWidth  != null ? config.maxWidth  / srcW : 1.0;
  const scaleH = config.maxHeight != null ? config.maxHeight / srcH : 1.0;
  const scale  = Math.min(scaleW, scaleH, 1.0);

  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  const mimeType = formatToMime(config.format);
  const quality  = config.format === 'png' ? undefined : config.quality / 100;

  const srcCanvas = new OffscreenCanvas(srcW, srcH);
  const srcCtx    = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Failed to get 2d context for source canvas');
  srcCtx.putImageData(imageData, 0, 0);

  if (scale === 1.0) {
    return srcCanvas.convertToBlob({ type: mimeType, quality });
  }

  const dstCanvas = new OffscreenCanvas(outW, outH);
  const dstCtx    = dstCanvas.getContext('2d');
  if (!dstCtx) throw new Error('Failed to get 2d context for destination canvas');
  dstCtx.drawImage(srcCanvas, 0, 0, outW, outH);

  return dstCanvas.convertToBlob({ type: mimeType, quality });
}
