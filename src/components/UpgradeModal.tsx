import { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle2, KeyRound } from 'lucide-react';

const CHECKOUT_URL =
  'https://batchlens.lemonsqueezy.com/checkout/buy/d4a94655-acc8-42f0-b7b0-7f18ee107473';

const FEATURES = [
  'Process 100s of images in one click',
  'WebP, JPEG & PNG export with custom resize',
  '100% private — no cloud uploads, ever',
  'Lifetime access — pay once, yours forever',
];

interface UpgradeModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function UpgradeModal({ onSuccess, onClose }: UpgradeModalProps) {
  const [keyInput,  setKeyInput]  = useState('');
  const [verifying, setVerifying] = useState(false);
  const [keyError,  setKeyError]  = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'button:not([disabled]), a, input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusable()[0]?.focus();

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTabTrap);
    return () => {
      document.removeEventListener('keydown', handleTabTrap);
      previouslyFocused?.focus();
    };
  }, []);

  const handleVerify = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setVerifying(true);
    setKeyError(null);
    try {
      const body = new URLSearchParams({
        license_key: key,
        instance_name: 'BatchLens Web App',
      });
      const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json() as { activated: boolean; error?: string };
      if (data.activated === true) {
        onSuccess();
      } else {
        setKeyError(data.error ?? 'Invalid license key. Please check and try again.');
      }
    } catch {
      setKeyError('Network error. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="flex flex-col gap-5 p-6 rounded-2xl bg-surface border border-border-subtle shadow-2xl w-96 max-w-[calc(100vw-2rem)]"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="upgrade-modal-title" className="text-sm font-semibold text-text-primary">
              Unlock Lightning-Fast Batch Processing
            </h2>
            <p className="text-xs text-text-muted">
              One payment. No subscription. Yours forever.
            </p>
          </div>
        </div>

        {/* ── Value bullets ──────────────────────────────────────────── */}
        <ul className="flex flex-col gap-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <span className="text-xs text-text-muted">{f}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border-muted" />

        {/* ── Buy button ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <button
              type="button"
              className="bar-btn bar-btn-primary w-full justify-center py-2.5 text-sm"
            >
              <Zap className="w-4 h-4" />
              Upgrade for $49 (Lifetime)
            </button>
          </a>
          <p className="text-[10px] text-text-faint text-center">
            Secure payment via Lemon Squeezy. Instant license delivery.
          </p>
        </div>

        <div className="border-t border-border-muted" />

        {/* ── License key activation ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-text-secondary">Already purchased?</p>
            <p className="text-xs text-text-muted">Activate your license key below.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setKeyError(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
              disabled={verifying}
              aria-label="License key"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-text-primary bg-surface-raised border border-border-subtle placeholder:text-text-faint focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors duration-150"
            />
            {keyError && (
              <p className="text-xs text-red-400">{keyError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || keyInput.trim() === ''}
            className="bar-btn bar-btn-outline w-full justify-center"
          >
            {verifying ? (
              <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            {verifying ? 'Verifying...' : 'Verify Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
