import { useCallback, useState } from 'react';
import { Zap, ShieldCheck, Gauge, Workflow, ImageDown } from 'lucide-react';
import { DropzoneArea } from './DropzoneArea';
import { useEditorStore } from '../store/use-editor-store';
import { fileToImageData } from '../utils/file-to-image-data';

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

const FEATURES = [
  {
    icon: Gauge,
    title: 'Zero Lag Experience',
    description:
      'Edits apply instantly — no loading bars, no waiting. Rust compiled to WebAssembly delivers near-native speed directly in your browser.',
  },
  {
    icon: Workflow,
    title: 'Uninterrupted Workflow',
    description:
      'All heavy processing runs in a background Web Worker. Your browser never freezes — keep scrolling, clicking, and typing while edits complete.',
  },
  {
    icon: ShieldCheck,
    title: '100% Private',
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

  const handleSampleClick = useCallback(
    async (sample: (typeof SAMPLE_IMAGES)[number]) => {
      if (loadingId) return;
      setLoadingId(sample.id);
      try {
        const response = await fetch(sample.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-wide">
          <Zap className="w-3 h-3" />
          Lightning-Fast Image Studio
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
          Professional Photo Editing,{' '}
          <span className="bg-linear-to-r from-accent to-violet-400 bg-clip-text text-transparent">
            Instantly in your Browser
          </span>
        </h1>

        <p className="text-base text-text-muted max-w-md leading-relaxed">
          Upload any photo and apply real-time filters powered by Rust compiled to
          WebAssembly — running entirely inside your browser, off the main thread.
        </p>
      </div>

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-3">
        <DropzoneArea onImageData={onImageData} />

        <div className="flex items-center gap-3 text-text-faint text-xs">
          <div className="flex-1 h-px bg-border-subtle" />
          or try a sample
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => {
            const isLoading = loadingId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                disabled={loadingId !== null}
                className="group relative rounded-xl overflow-hidden aspect-video border border-border-subtle hover:border-accent/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <img
                  src={sample.thumb}
                  alt={sample.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90">{sample.label}</span>
                  {isLoading ? (
                    <svg className="animate-spin w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
            className="flex flex-col gap-3 p-5 rounded-2xl border border-border-subtle bg-glass backdrop-blur-sm hover:border-accent/30 hover:bg-surface-raised transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-snug">{title}</p>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
