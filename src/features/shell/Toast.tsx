import { useCallback, useEffect, useRef, useState } from 'react';
import { onToast, type ToastPayload } from './toastBus';
import './Toast.css';

const TOAST_MS = 6000;

/** A single transient toast, bottom-center, for app-level messages (a failed
 * load, or a note with an action like Undo/Retry). Subscribes to the toast bus.
 * Messages are QUEUED and shown one at a time — a follow-up toast (e.g. "Copied")
 * can't clobber an actionable one before the user acts on it. Plain toasts
 * auto-expire after 6s; ACTIONABLE toasts (Undo/Retry) do NOT — they stay until
 * the user acts or dismisses, so an Undo can't silently vanish (which, on a
 * world-writable pad, would make an accidental delete permanently unrecoverable).
 * role=alert so assistive tech announces it. */
export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const queue = useRef<ToastPayload[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showing = useRef(false);

  // Show the next queued toast (or clear). Arm the auto-expire timer ONLY for a
  // toast with no action; an actionable toast waits for the user. Also used as
  // the dismiss/advance handler. Stable identity so the subscription effect
  // doesn't re-run.
  const advance = useCallback(() => {
    clearTimeout(timer.current);
    const next = queue.current.shift() ?? null;
    showing.current = !!next;
    setToast(next);
    timer.current = next && !next.action ? setTimeout(advance, TOAST_MS) : undefined;
  }, []);

  useEffect(() => {
    const off = onToast((t) => {
      queue.current.push(t);
      // Pump only when nothing is currently showing; otherwise the visible toast
      // (which may be an actionable one with no timer) must finish/be acted on
      // first, so it isn't clobbered.
      if (!showing.current) advance();
    });
    return () => {
      off();
      clearTimeout(timer.current);
    };
  }, [advance]);

  const dismiss = advance;

  if (!toast) return null;
  return (
    <div className="sk-toast" role="alert" data-testid="app-toast">
      <span className="sk-toast__msg">{toast.message}</span>
      {toast.action && (
        <button
          className="sk-toast__action"
          data-testid="app-toast-action"
          onClick={() => {
            toast.action?.run();
            dismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="sk-toast__close" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
