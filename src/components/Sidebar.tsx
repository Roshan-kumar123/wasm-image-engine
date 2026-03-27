import { Sun, Contrast, Layers } from 'lucide-react';
import { useEditorStore } from '../store/use-editor-store';
import { DownloadButton } from './DownloadButton';
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
    description: '3×3 kernel',
    Icon: Layers,
  },
];

interface SidebarProps {
  onFilterSelect: (filter: FilterType) => void;
  hasImage: boolean;
}

export function Sidebar({ onFilterSelect, hasImage }: SidebarProps) {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const activeFilter = useEditorStore((s) => s.activeFilter);
  const disabled = !hasImage || isProcessing;

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col gap-6 p-5 bg-sidebar-bg border-r border-white/5">
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
          return (
            <button
              key={id}
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
              <Icon className="w-4 h-4 flex-shrink-0" />
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
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Download */}
      <DownloadButton />
    </aside>
  );
}
