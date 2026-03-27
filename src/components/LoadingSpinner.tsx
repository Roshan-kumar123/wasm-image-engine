export function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm rounded-xl z-10">
      <svg
        className="animate-spin w-10 h-10 text-accent"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Processing image"
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-white/60 text-sm font-medium tracking-wide">
        Processing…
      </span>
    </div>
  );
}
