import { useCallback, useState } from 'react';
import {
  Zap,
  ShieldCheck,
  CreditCard,
  ImageDown,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DropzoneArea } from './DropzoneArea';

// ── Sample images ─────────────────────────────────────────────────────────────

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

// ── Feature pillars ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    label: 'WASM Speed',
    title: 'Near-Native Speed in the Browser',
    description:
      'Filters run in Rust compiled to WebAssembly — off the main thread, inside a Web Worker. No server round-trips. No waiting.',
  },
  {
    icon: ShieldCheck,
    label: '100% Local',
    title: 'Your Images Never Leave Your Device',
    description:
      'Zero cloud uploads, zero analytics on your files. Every pixel is processed locally. Works fully offline once loaded.',
  },
  {
    icon: CreditCard,
    label: 'Pay Once',
    title: 'Lifetime Access. No Subscriptions.',
    description:
      'One payment of $49 replaces recurring fees from cloud editors. Own it forever — updates included.',
  },
];

// ── Comparison table data ─────────────────────────────────────────────────────

const COMPARISON = [
  { label: 'Browser-native, no install',   batchlens: true,  others: false },
  { label: 'Zero cloud uploads',           batchlens: true,  others: false },
  { label: 'Bulk-process 100s of images',  batchlens: true,  others: false },
  { label: 'WebP / JPEG / PNG export',     batchlens: true,  others: true  },
  { label: 'Custom resize + quality',      batchlens: true,  others: false },
  { label: 'One-time price ($49)',         batchlens: true,  others: false },
  { label: 'Works offline',               batchlens: true,  others: false },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onFiles: (files: File[]) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingPage({ onFiles }: LandingPageProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: File[]) => {
      setFetchError(null);
      onFiles(files);
    },
    [onFiles],
  );

  const handleSampleClick = useCallback(
    async (sample: (typeof SAMPLE_IMAGES)[number]) => {
      if (loadingId) return;
      setLoadingId(sample.id);
      setFetchError(null);
      try {
        const response = await fetch(sample.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], `${sample.label.toLowerCase()}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
        onFiles([file]);
      } catch {
        setFetchError('Failed to load sample image. Please try uploading your own.');
      } finally {
        setLoadingId(null);
      }
    },
    [loadingId, onFiles],
  );

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-12 gap-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-wide">
          <Zap className="w-3 h-3" />
          Powered by Rust + WebAssembly
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
          Batch Image Processing.{' '}
          <span className="bg-linear-to-r from-accent to-violet-400 bg-clip-text text-transparent">
            Zero Server Uploads.
          </span>
        </h1>

        <p className="text-base text-text-muted max-w-xl leading-relaxed">
          BatchLens runs entirely in your browser using WebAssembly compiled from Rust.
          Resize, filter, and export hundreds of images in seconds — no cloud, no subscriptions,
          no privacy trade-offs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          {['No sign-up required', 'Works offline', 'WebP · JPEG · PNG export'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Dropzone (Primary CTA) ────────────────────────────────────────── */}
      <section className="w-full flex flex-col gap-4">
        <DropzoneArea onFiles={handleFiles} />

        <div className="flex items-center gap-3 text-text-faint text-xs">
          <div className="flex-1 h-px bg-border-subtle" />
          or try a sample image
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {fetchError && (
          <p className="text-red-400 text-xs text-center">{fetchError}</p>
        )}

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
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────── */}
      <section className="w-full flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Why BatchLens</p>
          <h2 className="text-xl font-bold text-text-primary">Built for Speed, Privacy, and Value</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, label, title, description }) => (
            <div
              key={label}
              className="flex flex-col gap-4 p-5 rounded-2xl border border-border-subtle bg-glass backdrop-blur-sm hover:border-accent/30 hover:bg-surface-raised transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{label}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-snug">{title}</p>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section className="w-full flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Comparison</p>
          <h2 className="text-xl font-bold text-text-primary">BatchLens vs. Everything Else</h2>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Cloud editors send your images to a server and charge you monthly. BatchLens runs locally, once.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-surface-raised px-5 py-3 text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border-subtle">
            <span>Feature</span>
            <span className="text-center text-accent">BatchLens</span>
            <span className="text-center">Cloud Editors</span>
          </div>

          {/* Rows */}
          {COMPARISON.map(({ label, batchlens, others }, i) => (
            <div
              key={label}
              className={[
                'grid grid-cols-3 px-5 py-3 text-xs items-center',
                i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/40',
              ].join(' ')}
            >
              <span className="text-text-secondary">{label}</span>
              <span className="flex justify-center">
                {batchlens
                  ? <CheckCircle2 className="w-4 h-4 text-accent" />
                  : <X className="w-4 h-4 text-text-faint" />}
              </span>
              <span className="flex justify-center">
                {others
                  ? <CheckCircle2 className="w-4 h-4 text-text-muted" />
                  : <X className="w-4 h-4 text-red-400/70" />}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer nudge ─────────────────────────────────────────────────── */}
      <section className="text-center flex flex-col items-center gap-3 pb-4">
        <p className="text-sm text-text-muted">
          No account. No upload. Just drop your images above and start editing.
        </p>
        <p className="text-[11px] text-text-faint">
          BatchLens · In-browser image processing · Built with Rust + WebAssembly
        </p>
      </section>

    </div>
  );
}
