import { useRef } from 'react';
import {
  Plus,
  RotateCcw,
  Columns2,
  Square,
  Download,
  Archive,
  Trash2,
} from 'lucide-react';

export type ViewMode = 'split' | 'single';

interface TopActionBarProps {
  isProcessing: boolean;
  isBatchExporting: boolean;
  hasProcessed: boolean;
  imageCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddImages: (files: File[]) => void;
  onReset: () => void;
  onClearAll: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
  onExport: () => void;
  onBatchExport: () => void;
}

export function TopActionBar({
  isProcessing,
  isBatchExporting,
  hasProcessed,
  imageCount,
  viewMode,
  onViewModeChange,
  onAddImages,
  onReset,
  onClearAll,
  onCompareStart,
  onCompareEnd,
  onExport,
  onBatchExport,
}: TopActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = isProcessing || isBatchExporting;
  const hasImage = imageCount > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onAddImages(files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-surface border border-border-subtle shrink-0 shadow-sm">
      {/* Hidden multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Left zone ──────────────────────────────────────────────────── */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        title="Add more images to the batch"
        className="bar-btn bar-btn-subtle"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Add Images</span>
      </button>

      {/* ── Centre zone — view toggle ──────────────────────────────────── */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-raised border border-border-muted">
        <ToggleSegment
          active={viewMode === 'split'}
          onClick={() => onViewModeChange('split')}
          disabled={busy || !hasProcessed}
          icon={<Columns2 className="w-3.5 h-3.5" />}
          label="Split"
          title="Side-by-side compare slider"
        />
        <ToggleSegment
          active={viewMode === 'single'}
          onClick={() => onViewModeChange('single')}
          disabled={busy || !hasProcessed}
          icon={<Square className="w-3.5 h-3.5" />}
          label="Single"
          title="Single view — hold Compare to peek original"
          onMouseDown={viewMode === 'single' && hasProcessed ? onCompareStart : undefined}
          onMouseUp={viewMode === 'single' && hasProcessed ? onCompareEnd : undefined}
          onMouseLeave={viewMode === 'single' && hasProcessed ? onCompareEnd : undefined}
          onTouchStart={viewMode === 'single' && hasProcessed ? onCompareStart : undefined}
          onTouchEnd={viewMode === 'single' && hasProcessed ? onCompareEnd : undefined}
        />
      </div>

      {/* ── Right zone ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={busy || !hasProcessed}
          title="Revert to original"
          className="bar-btn bar-btn-outline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Destructive clear — removes all images, keeps editor open */}
        <button
          onClick={onClearAll}
          disabled={busy || !hasImage}
          title="Remove all images"
          className="bar-btn bar-btn-subtle hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear All</span>
        </button>

        {/* Single-image export */}
        <button
          onClick={onExport}
          disabled={busy || !hasProcessed}
          title="Export active image"
          className="bar-btn bar-btn-primary"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export HD</span>
        </button>

        {/* Batch export — only shown when more than one image is loaded */}
        {imageCount > 1 && (
          <button
            onClick={onBatchExport}
            disabled={busy}
            title={`Export all ${imageCount} images as ZIP`}
            className="bar-btn bar-btn-outline"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export All</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Toggle segment button ─────────────────────────────────────────────── */

interface ToggleSegmentProps {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  title: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

function ToggleSegment({
  active,
  onClick,
  disabled,
  icon,
  label,
  title,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
}: ToggleSegmentProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 select-none',
        'disabled:opacity-35 disabled:cursor-not-allowed',
        active
          ? 'bg-accent text-white shadow-sm shadow-accent/25'
          : 'text-text-muted hover:text-text-secondary hover:bg-glass',
      ].join(' ')}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
