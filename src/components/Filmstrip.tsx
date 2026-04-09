import { memo, useRef } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import type { BatchImage } from "../types/image-worker.types";

interface FilmstripProps {
  images: BatchImage[];
  activeImageId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddImages: (files: File[]) => void;
}

export function Filmstrip({ images, activeImageId, onSelect, onRemove, onAddImages }: FilmstripProps) {
  return (
    <div className="shrink-0 border-t border-border-muted bg-surface-overlay overflow-x-auto">
      <div className="flex flex-row gap-2 p-2 w-max min-w-full">
        {images.map((image, index) => (
          <FilmstripThumb
            key={image.id}
            image={image}
            index={index}
            isActive={image.id === activeImageId}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
        {/* Persistent append button — always at the end of the strip */}
        <AppendButton onAddImages={onAddImages} />
      </div>
    </div>
  );
}

// ── Append button ─────────────────────────────────────────────────────────────

function AppendButton({ onAddImages }: { onAddImages: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) { onAddImages(files); e.target.value = ''; }
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title="Add more images"
        className="w-16 h-16 rounded-lg border-2 border-dashed border-border-subtle hover:border-accent/60 hover:bg-glass flex items-center justify-center text-text-faint hover:text-accent transition-all duration-150"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

interface ThumbProps {
  image: BatchImage;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

const FilmstripThumb = memo(function FilmstripThumb({
  image,
  index,
  isActive,
  onSelect,
  onRemove,
}: ThumbProps) {
  return (
    <div className="relative shrink-0 group">
      <button
        onClick={() => onSelect(image.id)}
        title={image.file.name}
        className={[
          "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-150 focus:outline-none",
          isActive
            ? "border-accent shadow-lg shadow-accent/30"
            : "border-border-subtle hover:border-accent/50",
        ].join(" ")}
      >
        <img
          src={image.objectUrl}
          alt={`Image ${index + 1}: ${image.file.name}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Processed overlay tint */}
        {image.processedUrl && (
          <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
        )}
        {/* Exported checkmark */}
        {image.hasBeenExported && (
          <div className="absolute bottom-0.5 right-0.5 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow-md" />
          </div>
        )}
      </button>

      {/* Remove button — appears on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
        title="Remove image"
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface border border-border-subtle text-text-faint hover:text-red-400 hover:border-red-400/50 transition-colors duration-100 items-center justify-center hidden group-hover:flex z-10"
      >
        <span className="text-[10px] leading-none">×</span>
      </button>

      {/* Index badge */}
      <div className="absolute bottom-0.5 left-0.5 px-1 rounded text-[9px] font-mono text-white/70 bg-black/50 pointer-events-none">
        {index + 1}
      </div>
    </div>
  );
});
