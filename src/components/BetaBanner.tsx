import { IS_PUBLIC_BETA } from '../config/beta';

export function BetaBanner() {
  if (!IS_PUBLIC_BETA) return null;

  return (
    <div className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-accent/10 border-b border-accent/20 text-xs shrink-0 z-10">
      <span className="text-text-secondary">
        <span className="font-semibold text-accent">⚡ BatchLens Public Beta</span>
        {' — '}All premium features are temporarily free.
      </span>
      <a
        href="mailto:roshanrajput897@gmail.com?subject=BatchLens%20Beta%20Feedback"
        target="_blank"
        rel="noopener noreferrer"
        className="bar-btn bar-btn-subtle shrink-0 text-xs"
      >
        Give Feedback / Report Bug
      </a>
    </div>
  );
}
