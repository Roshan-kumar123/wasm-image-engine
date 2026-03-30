import { useState, useEffect } from 'react';
import { Sun, Contrast, Layers } from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';
import type { FilterType } from '../types/image-worker.types';
import type { FC } from 'react';

interface FilterConfig {
  id: FilterType;
  label: string;
  description: string;
  Icon: FC<{ className?: string }>;
}

const FILTERS: FilterConfig[] = [
  {
    id: 'grayscale',
    label: 'Grayscale',
    description: 'BT.601 luminance',
    Icon: Sun,
  },
  {
    id: 'invert',
    label: 'Invert',
    description: 'Negate RGB channels',
    Icon: Contrast,
  },
  {
    id: 'blur',
    label: 'Box Blur',
    description: 'Two-pass radius blur',
    Icon: Layers,
  },
];

// Per-filter slider configuration
const SLIDER_CONFIG: Record<FilterType, { min: number; max: number; label: string; unit: string; lowLabel: string; highLabel: string }> = {
  grayscale: { min: 0, max: 100, label: 'Intensity', unit: '%', lowLabel: 'Off', highLabel: 'Full' },
  invert:    { min: 0, max: 100, label: 'Intensity', unit: '%', lowLabel: 'Off', highLabel: 'Full' },
  blur:      { min: 1, max: 40,  label: 'Radius',    unit: 'px', lowLabel: 'Subtle', highLabel: 'Heavy' },
};

interface SidebarProps {
  onFilterSelect: (filter: FilterType) => void;
  hasImage: boolean;
  onParameterChange: (filter: FilterType, value: number) => void;
}

export function Sidebar({ onFilterSelect, hasImage, onParameterChange }: SidebarProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const activeFilter = useEditorStore((s) => s.activeFilter);
  const filterParameter = useEditorStore((s) => s.filterParameter);
  const setFilterParameter = useEditorStore((s) => s.setFilterParameter);
  const disabled = !hasImage || isProcessing;

  // Local state drives the slider value so the knob moves instantly during drag,
  // without waiting for a Zustand → React re-render round-trip.
  const [localSliderVal, setLocalSliderVal] = useState(filterParameter);

  // Sync local value whenever the active filter changes (store resets filterParameter).
  useEffect(() => {
    setLocalSliderVal(filterParameter);
  }, [activeFilter, filterParameter]);

  return (
    <aside className="w-60 shrink-0 flex flex-col gap-6 p-5 bg-sidebar-bg border-r border-white/5">
      {/* Brand */}
      <div className="pt-1">
        <h1 className="text-white font-semibold text-sm tracking-tight">
          Wasm Image Editor
        </h1>
        <p className="text-white/35 text-xs mt-0.5">Rust · WebAssembly · React</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-1">
          Filters
        </span>
        {FILTERS.map(({ id, label, description, Icon }) => {
          const isActive = activeFilter === id;
          const slider = SLIDER_CONFIG[id];
          return (
            <div key={id} className="flex flex-col gap-2">
              <button
                disabled={disabled}
                onClick={() => onFilterSelect(id)}
                className={[
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left',
                  'transition-all duration-150',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <p
                    className={[
                      'text-xs leading-tight mt-0.5 truncate',
                      isActive ? 'text-white/70' : 'text-white/35',
                    ].join(' ')}
                  >
                    {description}
                  </p>
                </div>
              </button>

              {/* Parameter slider — shown for the active filter */}
              {isActive && (
                <div className="px-3 pb-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{slider.label}</span>
                    {/* localSliderVal updates on every drag tick — no snap-back in the label */}
                    <span className="font-mono text-accent">
                      {localSliderVal}{slider.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    value={localSliderVal}
                    disabled={isProcessing}
                    onChange={(e) => setLocalSliderVal(Number(e.target.value))}
                    onMouseUp={() => {
                      setFilterParameter(localSliderVal);
                      if (activeFilter) onParameterChange(activeFilter, localSliderVal);
                    }}
                    onTouchEnd={() => {
                      setFilterParameter(localSliderVal);
                      if (activeFilter) onParameterChange(activeFilter, localSliderVal);
                    }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] text-white/25">
                    <span>{slider.lowLabel}</span>
                    <span>{slider.highLabel}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </aside>
  );
}
