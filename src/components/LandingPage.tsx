import { useCallback, useState } from 'react';
import { Zap, ShieldCheck, Cpu, ImageDown } from 'lucide-react';
import { DropzoneArea } from './DropzoneArea';
import { useEditorStore } from '../store/use-editor-store';
import { fileToImageData } from '../utils/file-to-image-data';

// ── Sample images (Unsplash – direct CDN links, no API key required) ─────────
// Each URL is set to 1280px wide for a realistic high-res processing demo.
const SAMPLE_IMAGES = [
  {
    id: 'nature',
    label: 'Nature',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1280&q=80',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=320&q=70',
  },
  {
    id: 'portrait',
    label: 'Portrait',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1280&q=80',
    thumb: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=320&q=70',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1280&q=80',
    thumb: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=320&q=70',
  },
];

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Zap,
    title: 'Rust / WebAssembly Speed',
    description:
      'Pixel processing runs as hand-optimised Wasm bytecode — near-native speed in the browser with zero server round-trips.',
  },
  {
    icon: Cpu,
    title: 'Off-Main-Thread',
    description:
      'All computation lives inside a Web Worker. The UI stays silky-smooth at 60 fps while the engine crunches a 4K frame.',
  },
  {
    icon: ShieldCheck,
    title: '100 % Private',
    description:
      'Your images never leave your device. No uploads, no cloud calls — every pixel stays local, every time.',
  },
];

interface LandingPageProps {
  onImageData: (imageData: ImageData) => void;
}

export function LandingPage({ onImageData }: LandingPageProps) {
  const setOriginalImage = useEditorStore((s) => s.setOriginalImage);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fetch a sample Unsplash URL, convert to a Blob/File, then decode to ImageData
  const handleSampleClick = useCallback(
    async (sample: (typeof SAMPLE_IMAGES)[number]) => {
      if (loadingId) return;
      setLoadingId(sample.id);
      try {
        const response = await fetch(sample.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        // Wrap in a File so the store (which expects File | null) is satisfied
        const file = new File([blob], `${sample.label.toLowerCase()}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
        setOriginalImage(file);
        const imageData = await fileToImageData(file);
        onImageData(imageData);
      } catch (err) {
        console.error('Failed to load sample image:', err);
      } finally {
        setLoadingId(null);
      }
    },
    [loadingId, setOriginalImage, onImageData],
  );

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-10 gap-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center flex flex-col items-center gap-4">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-wide">
          <Zap className="w-3 h-3" />
          Rust · WebAssembly · Web Workers
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          High-Performance{' '}
          <span className="bg-gradient-to-r from-accent to-violet-400 bg-clip-text text-transparent">
            In-Browser
          </span>{' '}
          Image Engine
        </h1>

        <p className="text-base text-white/50 max-w-md leading-relaxed">
          Upload any photo and apply real-time filters powered by Rust compiled to
          WebAssembly — running entirely inside your browser, off the main thread.
        </p>
      </div>

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-3">
        <DropzoneArea onImageData={onImageData} />

        {/* Divider */}
        <div className="flex items-center gap-3 text-white/20 text-xs">
          <div className="flex-1 h-px bg-white/10" />
          or try a sample
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── One-click sample images ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => {
            const isLoading = loadingId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                disabled={loadingId !== null}
                className="group relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-accent/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <img
                  src={sample.thumb}
                  alt={sample.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Label / spinner */}
                <div className="absolute bottom-0 inset-x-0 p-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90">
                    {sample.label}
                  </span>
                  {isLoading ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5 text-accent flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <ImageDown className="w-3.5 h-3.5 text-white/50 group-hover:text-accent transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-3 p-5 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm hover:border-accent/30 hover:bg-white/6 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90 leading-snug">
                {title}
              </p>
              <p className="text-xs text-white/45 mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
