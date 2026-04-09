interface BatchProgressOverlayProps {
  current: number;
  total: number;
}

export function BatchProgressOverlay({ current, total }: BatchProgressOverlayProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-surface border border-border-subtle shadow-2xl min-w-72 w-80">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-text-primary">
            Exporting batch...
          </p>
          <p className="text-xs text-text-muted">
            Processing {current} of {total} images
          </p>
        </div>

        {/* Progress track */}
        <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-text-faint tabular-nums text-right">
          {percent}%
        </p>
      </div>
    </div>
  );
}
