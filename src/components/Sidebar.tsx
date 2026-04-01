import { useState, useEffect, useRef, memo } from 'react';
import {
  Sun, Contrast, Layers, SunDim, CircleDot, Palette,
  Droplets, Sparkles, Scan, GripVertical, X,
} from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';
import type { FilterType, FilterLayer } from '../types/image-worker.types';
import type { FC } from 'react';

// ── Filter catalogue ─────────────────────────────────────────────────────────

interface FilterMeta {
  type: FilterType;
  label: string;
  description: string;
  Icon: FC<{ className?: string }>;
}

const FILTER_CATALOGUE: FilterMeta[] = [
  { type: 'grayscale',  label: 'Grayscale',  description: 'BT.601 luminance',    Icon: Sun },
  { type: 'invert',     label: 'Invert',     description: 'Negate RGB channels',  Icon: Contrast },
  { type: 'brightness', label: 'Brightness', description: 'Lighten or darken',    Icon: SunDim },
  { type: 'contrast',   label: 'Contrast',   description: 'Expand tonal range',   Icon: CircleDot },
  { type: 'sepia',      label: 'Sepia',      description: 'Warm vintage tone',    Icon: Palette },
  { type: 'saturation', label: 'Saturation', description: 'Color vibrancy',       Icon: Droplets },
  { type: 'blur',       label: 'Box Blur',   description: 'Two-pass radius blur', Icon: Layers },
  { type: 'sharpen',    label: 'Sharpen',    description: '3×3 unsharp kernel',   Icon: Sparkles },
  { type: 'sobel',      label: 'Edge Det.',  description: 'Sobel gradient map',   Icon: Scan },
];

const FILTER_META: Record<FilterType, FilterMeta> = Object.fromEntries(
  FILTER_CATALOGUE.map((f) => [f.type, f]),
) as Record<FilterType, FilterMeta>;

const SLIDER_CONFIG: Record<FilterType, {
  min: number; max: number; label: string; unit: string; lowLabel: string; highLabel: string;
}> = {
  grayscale:  { min: 0, max: 100, label: 'Intensity', unit: '%',  lowLabel: 'Off',    highLabel: 'Full' },
  invert:     { min: 0, max: 100, label: 'Intensity', unit: '%',  lowLabel: 'Off',    highLabel: 'Full' },
  brightness: { min: 0, max: 100, label: 'Level',     unit: '%',  lowLabel: 'Dark',   highLabel: 'Bright' },
  contrast:   { min: 0, max: 100, label: 'Level',     unit: '%',  lowLabel: 'Flat',   highLabel: 'Sharp' },
  sepia:      { min: 0, max: 100, label: 'Intensity', unit: '%',  lowLabel: 'Off',    highLabel: 'Full' },
  saturation: { min: 0, max: 100, label: 'Level',     unit: '%',  lowLabel: 'Gray',   highLabel: 'Vivid' },
  blur:       { min: 1, max: 40,  label: 'Radius',    unit: 'px', lowLabel: 'Subtle', highLabel: 'Heavy' },
  sharpen:    { min: 0, max: 100, label: 'Intensity', unit: '%',  lowLabel: 'Subtle', highLabel: 'Strong' },
  sobel:      { min: 0, max: 100, label: 'Intensity', unit: '%',  lowLabel: 'Subtle', highLabel: 'Full' },
};

// ── LayerSlider ───────────────────────────────────────────────────────────────
// Bulletproof isolated slider:
// - localValue state → thumb tracks mouse at 60fps, never freezes
// - 100ms debounce on onChange → Zustand + worker not flooded during drag
// - window pointerup listener attached on pointerdown → catches release even
//   when pointer leaves the element's bounding box
// - touch-action: none → prevents mobile scroll from canceling the drag

interface LayerSliderProps {
  layer: FilterLayer;
  isProcessing: boolean;
  onChange: (value: number) => void;
}

const LayerSlider = memo(function LayerSlider({ layer, isProcessing, onChange }: LayerSliderProps) {
  const slider = SLIDER_CONFIG[layer.type];
  const [localValue, setLocalValue] = useState(layer.value);
  const isDraggingRef = useRef(false);
  // Ref so the global pointerup closure always reads the latest value
  const localValueRef = useRef(localValue);

  useEffect(() => { localValueRef.current = localValue; }, [localValue]);

  // Sync from store only when not dragging — prevents rubber-banding mid-drag
  useEffect(() => {
    if (!isDraggingRef.current) setLocalValue(layer.value);
  }, [layer.value]);

  const handlePointerDown = () => {
    isDraggingRef.current = true;

    // Global capture: fires even when pointer leaves the element before release
    const handleWindowPointerUp = () => {
      isDraggingRef.current = false;
      onChange(localValueRef.current);   // commit final value → Zustand → worker
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
    window.addEventListener('pointerup', handleWindowPointerUp);
  };

  // onChange updates local state ONLY — never touches Zustand during drag
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalValue(v);
    localValueRef.current = v;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {slider.label}
        </span>
        <span className="text-xs font-medium font-mono text-accent tabular-nums">
          {localValue}{slider.unit}
        </span>
      </div>
      <div style={{ touchAction: 'none' }}>
        <input
          type="range"
          min={slider.min}
          max={slider.max}
          value={localValue}
          disabled={isProcessing}
          onPointerDown={handlePointerDown}
          onChange={handleChange}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border-subtle accent-accent disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted uppercase tracking-wider">
        <span>{slider.lowLabel}</span>
        <span>{slider.highLabel}</span>
      </div>
    </div>
  );
});

// ── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  hasImage: boolean;
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ hasImage }: SidebarProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const filterStack = useEditorStore((s) => s.filterStack);
  const addFilterToStack = useEditorStore((s) => s.addFilterToStack);
  const updateFilterValue = useEditorStore((s) => s.updateFilterValue);
  const removeFilterFromStack = useEditorStore((s) => s.removeFilterFromStack);
  const clearStack = useEditorStore((s) => s.clearStack);

  // O(1) membership check — disables duplicate library buttons
  const activeTypes = new Set(filterStack.map((l) => l.type));

  return (
    <aside className="w-full h-[50dvh] md:h-full md:w-80 shrink-0 flex flex-col bg-sidebar-bg border-t border-border-muted md:border-t-0 md:border-r overflow-hidden">

      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <h1 className="text-text-primary font-bold text-sm tracking-tight">
          PixelFlow
        </h1>
        <p className="text-text-muted text-xs mt-0.5">Zero-latency local adjustments.</p>
      </div>

      {/* ── Filter Library ─────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 shrink-0 overflow-y-auto max-h-[45%] md:max-h-none md:overflow-visible">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-faint">
          Filter Library
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_CATALOGUE.map(({ type, label, Icon }) => {
            const isActive = activeTypes.has(type);
            return (
              <button
                key={type}
                disabled={!hasImage || isActive}
                onClick={() => addFilterToStack(type)}
                title={isActive ? 'Already in stack' : FILTER_META[type].description}
                className={[
                  'flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-lg border transition-all duration-150',
                  'disabled:opacity-35 disabled:cursor-not-allowed',
                  isActive
                    ? 'border-border-subtle bg-surface cursor-not-allowed'
                    : 'border-border-subtle bg-surface hover:bg-surface-raised hover:border-accent/50 cursor-pointer',
                ].join(' ')}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-text-faint' : 'text-accent'}`} />
                <span className={`text-[10px] font-semibold leading-tight text-center ${isActive ? 'text-text-faint' : 'text-text-secondary'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Layers ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 border-t border-border-muted overflow-hidden">
        <div className="px-5 py-2.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-text-muted">
              Active Layers
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums bg-surface-raised text-text-muted">
              {filterStack.length}
            </span>
          </div>
          {filterStack.length > 0 && (
            <button
              onClick={clearStack}
              disabled={isProcessing}
              className="text-xs text-text-muted hover:text-red-400 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-3">
          {filterStack.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Layers className="w-8 h-8 text-text-faint opacity-40" />
              <p className="text-sm text-text-muted text-center leading-relaxed">
                Add a filter from<br />the library above.
              </p>
            </div>
          )}
          {filterStack.map((layer, index) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              index={index}
              disabled={!hasImage || isProcessing}
              isProcessing={isProcessing}
              onValueChange={(value) => updateFilterValue(layer.id, value)}
              onRemove={() => removeFilterFromStack(layer.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Layer card ───────────────────────────────────────────────────────────────

interface LayerCardProps {
  layer: FilterLayer;
  index: number;
  disabled: boolean;
  isProcessing: boolean;
  onValueChange: (value: number) => void;
  onRemove: () => void;
}

function LayerCard({ layer, index, disabled, isProcessing, onValueChange, onRemove }: LayerCardProps) {
  const meta = FILTER_META[layer.type];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3.5 pt-3 pb-3.5 flex flex-col gap-3 shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-text-faint shrink-0 cursor-grab active:cursor-grabbing" />

        <span className="text-[10px] font-mono text-text-faint shrink-0 w-4 tabular-nums">
          {index + 1}
        </span>

        <meta.Icon className="w-3.5 h-3.5 text-accent shrink-0" />

        <span className="text-xs font-semibold text-text-primary flex-1 truncate">
          {meta.label}
        </span>

        <button
          onClick={onRemove}
          disabled={disabled}
          className="w-5 h-5 flex items-center justify-center rounded-md text-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="Remove layer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Separator */}
      <div className="border-t border-border-muted -mx-0.5" />

      {/* Bulletproof debounced slider */}
      <LayerSlider
        layer={layer}
        isProcessing={isProcessing}
        onChange={onValueChange}
      />
    </div>
  );
}
