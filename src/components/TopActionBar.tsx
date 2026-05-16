import { useRef, useState } from 'react';
import { ExportSettingsModal, type ExportConfig } from './ExportSettingsModal';
import { UpgradeModal } from './UpgradeModal';
import { useEditorStore } from '../store/use-editor-store';
import { IS_PUBLIC_BETA } from '../config/beta';
import {
  Plus,
  RotateCcw,
  Columns2,
  Square,
  Download,
  Archive,
  Trash2,
  Lock,
  ShieldOff,
} from 'lucide-react';

export type ViewMode = 'split' | 'single';

interface TopActionBarProps {
  isProcessing: boolean;
  isBatchExporting: boolean;
  isExportingSingle: boolean;
  hasProcessed: boolean;
  imageCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddImages: (files: File[]) => void;
  onReset: () => void;
  onClearAll: () => void;
  onCompareStart: () => void;
  onCompareEnd: () => void;
  onExport: (config: ExportConfig) => void;
  onBatchExport: (config: ExportConfig) => void;
}

export function TopActionBar({
  isProcessing,
  isBatchExporting,
  isExportingSingle,
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
  const busy = isProcessing || isBatchExporting || isExportingSingle;
  const hasImage = imageCount > 0;
  const [exportTarget, setExportTarget] = useState<'single' | 'batch' | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const isPro        = useEditorStore((s) => s.isPro);
  const unlockPro    = useEditorStore((s) => s.unlockPro);
  const deactivatePro = useEditorStore((s) => s.deactivatePro);

  const handleProUnlock = (licenseKey: string, instanceId: string) => {
    unlockPro(licenseKey, instanceId);
    setShowUpgradeModal(false);
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivatePro();
    } finally {
      setDeactivating(false);
    }
  };

  const handleExportConfirm = (config: ExportConfig) => {
    const target = exportTarget;
    setExportTarget(null);
    if (target === 'single') {
      onExport(config);
    } else {
      onBatchExport(config);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onAddImages(files);
      e.target.value = '';
    }
  };

  return (
    <>
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

        {/* Export buttons — single button when one image, two buttons for batch */}
        {imageCount > 1 ? (
          <>
            <button
              onClick={() => setExportTarget('single')}
              disabled={busy || !hasProcessed}
              title="Export the currently active image"
              className="bar-btn bar-btn-outline"
            >
              {isExportingSingle ? (
                <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isExportingSingle ? 'Exporting...' : 'Export Current'}
              </span>
            </button>
            <button
              onClick={() => (!IS_PUBLIC_BETA && !isPro) ? setShowUpgradeModal(true) : setExportTarget('batch')}
              disabled={busy}
              title={(!IS_PUBLIC_BETA && !isPro) ? 'Upgrade to Pro to export batches' : `Export all ${imageCount} images as ZIP`}
              className="bar-btn bar-btn-primary"
            >
              {(!IS_PUBLIC_BETA && !isPro) ? <Lock className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{(!IS_PUBLIC_BETA && !isPro) ? 'Export All · Pro' : 'Export All'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setExportTarget('single')}
            disabled={busy || !hasProcessed}
            title="Export image"
            className="bar-btn bar-btn-primary"
          >
            {isExportingSingle ? (
              <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isExportingSingle ? 'Exporting...' : 'Export Image'}
            </span>
          </button>
        )}

        {/* Deactivate — only shown when Pro is active AND not in beta */}
        {isPro && !IS_PUBLIC_BETA && (
          <button
            onClick={handleDeactivate}
            disabled={busy || deactivating}
            title="Deactivate license on this device"
            className="bar-btn bar-btn-subtle hover:text-red-400 hover:bg-red-500/10"
          >
            {deactivating ? (
              <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <ShieldOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </span>
          </button>
        )}
      </div>
    </div>

    {exportTarget !== null && (
      <ExportSettingsModal
        isBatch={exportTarget === 'batch'}
        onConfirm={handleExportConfirm}
        onCancel={() => setExportTarget(null)}
      />
    )}

    {!IS_PUBLIC_BETA && showUpgradeModal && (
      <UpgradeModal
        onSuccess={handleProUnlock}
        onClose={() => setShowUpgradeModal(false)}
      />
    )}
    </>
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
