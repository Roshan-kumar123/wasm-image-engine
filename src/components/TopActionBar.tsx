import { useRef } from 'react';
import {
  Upload,
  RotateCcw,
  Columns2,
  Square,
  Download,
} from 'lucide-react';

export type ViewMode = 'split' | 'single';

interface TopActionBarProps {
  isProcessing: boolean;
  hasProcessed: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUploadNew: (file: File) => void;
  onReset: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
  onExport: () => void;
}

export function TopActionBar({
  isProcessing,
  hasProcessed,
  viewMode,
  onViewModeChange,
  onUploadNew,
  onReset,
  onCompareStart,
  onCompareEnd,
  onExport,
}: TopActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadNew(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-surface border border-border-subtle shrink-0 shadow-sm">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Left zone ──────────────────────────────────────────────────── */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="bar-btn bar-btn-subtle"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Upload New</span>
      </button>

      {/* ── Centre zone — view toggle ──────────────────────────────────── */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-raised border border-border-muted">
        <ToggleSegment
          active={viewMode === 'split'}
          onClick={() => onViewModeChange('split')}
          disabled={isProcessing || !hasProcessed}
          icon={<Columns2 className="w-3.5 h-3.5" />}
          label="Split"
          title="Side-by-side compare slider"
        />
        <ToggleSegment
          active={viewMode === 'single'}
          onClick={() => onViewModeChange('single')}
          disabled={isProcessing || !hasProcessed}
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
          disabled={isProcessing || !hasProcessed}
          title="Revert to original"
          className="bar-btn bar-btn-outline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onExport}
          disabled={isProcessing || !hasProcessed}
          className="bar-btn bar-btn-primary"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export HD</span>
        </button>
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
