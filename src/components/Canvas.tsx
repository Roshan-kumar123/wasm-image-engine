import { PanelLeft } from 'lucide-react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';
import { useEditorStore, selectActiveImage } from '../store/use-editor-store';
import { DropzoneArea } from './DropzoneArea';
import type { ViewMode } from './TopActionBar';

// ── Custom slider handle ──────────────────────────────────────────────────────
function SliderHandle() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="absolute inset-0 flex justify-center pointer-events-none">
        <div className="w-0.5 h-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
      </div>
      <div className="relative z-10 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-slate-700">
          <path
            d="M6 4L2 9l4 5M12 4l4 5-4 5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ── Labels for before/after ───────────────────────────────────────────────────
function SliderLabel({ text, side }: { text: string; side: 'left' | 'right' }) {
  return (
    <div
      className={[
        'absolute top-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
        'bg-black/50 backdrop-blur-sm text-white/80 border border-white/10',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      {text}
    </div>
  );
}

interface CanvasProps {
  viewMode: ViewMode;
  isComparing: boolean;
  onFiles: (files: File[]) => void;
}

export function Canvas({ viewMode, isComparing, onFiles }: CanvasProps) {
  const activeImage = useEditorStore(selectActiveImage);
  const processingTimeMs = useEditorStore((s) => s.processingTimeMs);

  const originalUrl = activeImage?.objectUrl ?? null;
  const processedImageUrl = activeImage?.processedUrl ?? null;

  // ── Empty state — in-canvas dropzone ────────────────────────────────────────
  if (!originalUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <DropzoneArea onFiles={onFiles} />
        </div>
      </div>
    );
  }

  // ── Single view: hold-to-compare shows original ─────────────────────────────
  if (processedImageUrl && viewMode === 'single') {
    const showOriginal = isComparing;
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={showOriginal ? originalUrl : processedImageUrl}
          alt={showOriginal ? 'Original image' : 'Filtered image'}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-black/50 backdrop-blur-sm text-white/80 border border-white/10 z-10">
          {showOriginal ? 'Original' : 'Filtered'}
        </div>
        {processingTimeMs !== null && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono select-none shadow-lg">
            <span className="text-accent">⚡</span>
            Wasm compute: {processingTimeMs.toFixed(1)}ms
          </div>
        )}
      </div>
    );
  }

  // ── Split view: before/after slider ─────────────────────────────────────────
  if (processedImageUrl && viewMode === 'split') {
    return (
      <div className="relative flex-1 w-full h-full overflow-hidden rounded-xl" style={{ touchAction: 'none' }}>
        <ReactCompareSlider
          handle={<SliderHandle />}
          itemOne={
            <div className="relative w-full h-full">
              <SliderLabel text="Original" side="left" />
              <ReactCompareSliderImage
                src={originalUrl}
                alt="Original image"
                style={{ objectFit: 'contain', objectPosition: 'center', background: 'transparent' }}
              />
            </div>
          }
          itemTwo={
            <div className="relative w-full h-full">
              <SliderLabel text="Filtered" side="right" />
              <ReactCompareSliderImage
                src={processedImageUrl}
                alt="Filtered image"
                style={{ objectFit: 'contain', objectPosition: 'center', background: 'transparent' }}
              />
            </div>
          }
          style={{ width: '100%', height: '100%' }}
          className="rounded-xl"
        />
        {processingTimeMs !== null && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono select-none shadow-lg">
            <span className="text-accent">⚡</span>
            Wasm compute: {processingTimeMs.toFixed(1)}ms
          </div>
        )}
      </div>
    );
  }

  // ── Plain preview (no filter applied yet) ───────────────────────────────────
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <img
        src={originalUrl}
        alt="Original image preview"
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full backdrop-blur-md bg-black/60 text-white/90 text-xs md:text-sm font-medium shadow-xl z-10 animate-pulse pointer-events-none whitespace-nowrap">
        <PanelLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent shrink-0" />
        <span className="inline md:hidden">Tap a filter below to begin</span>
        <span className="hidden md:inline">Select a filter from the sidebar to begin</span>
      </div>
    </div>
  );
}
