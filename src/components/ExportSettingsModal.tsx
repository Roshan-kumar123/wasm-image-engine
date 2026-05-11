import { useState, useEffect, useRef } from 'react';
import { Archive, Download } from 'lucide-react';

export interface ExportConfig {
  format: 'jpeg' | 'webp' | 'png';
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
}

interface ExportSettingsModalProps {
  isBatch: boolean;
  onConfirm: (config: ExportConfig) => void;
  onCancel: () => void;
}

const FORMATS = [
  { value: 'webp', label: 'WebP', hint: 'Best ratio' },
  { value: 'jpeg', label: 'JPEG', hint: 'Compatible' },
  { value: 'png',  label: 'PNG',  hint: 'Lossless'  },
] as const;

export function ExportSettingsModal({ isBatch, onConfirm, onCancel }: ExportSettingsModalProps) {
  const [format, setFormat] = useState<'jpeg' | 'webp' | 'png'>('webp');
  const [quality, setQuality] = useState<number>(85);
  const [maxWidthRaw,  setMaxWidthRaw]  = useState<string>('');
  const [maxHeightRaw, setMaxHeightRaw] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Focus trap
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusable()[0]?.focus();

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTabTrap);
    return () => {
      document.removeEventListener('keydown', handleTabTrap);
      previouslyFocused?.focus();
    };
  }, []);

  const buildConfig = (): ExportConfig => ({
    format,
    quality,
    maxWidth:  maxWidthRaw  === '' ? null : Math.min(8192, Math.max(1, parseInt(maxWidthRaw,  10))),
    maxHeight: maxHeightRaw === '' ? null : Math.min(8192, Math.max(1, parseInt(maxHeightRaw, 10))),
  });

  const isPng = format === 'png';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={panelRef}
        className="flex flex-col gap-5 p-6 rounded-2xl bg-surface border border-border-subtle shadow-2xl w-96 max-w-[calc(100vw-2rem)]"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-0.5">
          <h2 id="export-modal-title" className="text-sm font-semibold text-text-primary">
            Export Settings
          </h2>
          <p className="text-xs text-text-muted">
            {isBatch
              ? 'Configure format and dimensions for the batch export.'
              : 'Configure format and dimensions for your image.'}
          </p>
        </div>

        <div className="border-t border-border-muted" />

        {/* ── Format Selector ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Format
          </span>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Export format">
            {FORMATS.map(({ value, label, hint }) => (
              <label
                key={value}
                className={[
                  'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border cursor-pointer',
                  'transition-all duration-150 select-none',
                  format === value
                    ? 'border-accent/70 bg-accent/10 text-accent'
                    : 'border-border-subtle bg-surface hover:bg-surface-raised hover:border-accent/40 text-text-secondary',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="sr-only"
                />
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                <span className="text-[10px] text-text-faint">{hint}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Quality Slider ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Quality
            </span>
            <span className={[
              'text-xs font-medium font-mono tabular-nums',
              isPng ? 'text-text-faint' : 'text-accent',
            ].join(' ')}>
              {isPng ? 'N/A' : `${quality}%`}
            </span>
          </div>
          <div style={{ touchAction: 'none' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={quality}
              disabled={isPng}
              onChange={(e) => setQuality(Number(e.target.value))}
              aria-label="Export quality"
              aria-disabled={isPng}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border-subtle accent-accent disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted uppercase tracking-wider">
            <span>Low</span>
            <span>High</span>
          </div>
          {isPng && (
            <p className="text-[10px] text-text-faint italic">
              PNG is lossless — quality setting has no effect.
            </p>
          )}
        </div>

        {/* ── Resize Controls ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Resize (optional)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="export-max-width" className="text-[10px] text-text-muted uppercase tracking-wider">
                Max Width
              </label>
              <input
                id="export-max-width"
                type="number"
                min={1}
                max={8192}
                placeholder="e.g. 1920"
                value={maxWidthRaw}
                onChange={(e) => setMaxWidthRaw(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-text-primary bg-surface-raised border border-border-subtle placeholder:text-text-faint focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors duration-150"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="export-max-height" className="text-[10px] text-text-muted uppercase tracking-wider">
                Max Height
              </label>
              <input
                id="export-max-height"
                type="number"
                min={1}
                max={8192}
                placeholder="e.g. 1080"
                value={maxHeightRaw}
                onChange={(e) => setMaxHeightRaw(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-text-primary bg-surface-raised border border-border-subtle placeholder:text-text-faint focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors duration-150"
              />
            </div>
          </div>
          <p className="text-[10px] text-text-faint">
            Aspect ratio will be preserved. Leave blank to keep original dimensions.
          </p>
        </div>

        <div className="border-t border-border-muted" />

        {/* ── Action Buttons ─────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="bar-btn bar-btn-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(buildConfig())}
            className="bar-btn bar-btn-primary"
          >
            {isBatch
              ? <Archive className="w-3.5 h-3.5" />
              : <Download className="w-3.5 h-3.5" />}
            {isBatch ? 'Start Batch Export' : 'Export Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
