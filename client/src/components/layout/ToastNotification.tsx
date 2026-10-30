import React, { useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Parses raw error strings (such as JSON blobs from SDKs or HTTP status codes)
 * into clean, human-friendly text.
 */
function formatToastMessage(raw: string): string {
  if (!raw) return 'Operation update';

  // Check if string contains JSON error payload
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) return parsed.error.message;
      if (typeof parsed.error === 'string') return parsed.error;
      if (parsed.message) return parsed.message;
    }
  } catch {
    // Not valid JSON, continue with string cleanup
  }

  // Strip common noisy prefixes like "NotFoundError: 404 " or "Error: "
  return raw
    .replace(/^(NotFoundError:\s*|Error:\s*)?\d{3}\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim() || raw;
}

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useCanvasStore();

  useEffect(() => {
    if (!toast) return;
    // Auto-dismiss toast after 7 seconds, user can also click cancel (X) anytime
    const timer = setTimeout(() => {
      dismissToast();
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const cleanMessage = formatToastMessage(toast.message);
  const type = toast.type || 'info';

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-3.5 rounded-xl border max-w-sm sm:max-w-md shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: type === 'error' ? 'rgba(244, 63, 94, 0.25)' : 'var(--border-subtle)',
      }}
    >
      {/* Type Icon */}
      {icons[type]}

      {/* Message content */}
      <div className="flex-1 pr-1">
        <p className="text-xs text-[var(--text-primary)] leading-relaxed select-text font-normal">
          {cleanMessage}
        </p>
      </div>

      {/* Dismiss / Cancel Button */}
      <button
        type="button"
        onClick={dismissToast}
        className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
