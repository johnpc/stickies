import { useEffect, useRef, useState } from 'react';
import { onToast, type ToastPayload } from './toastBus';
import './Toast.css';

const TOAST_MS = 6000;

/** A single transient toast, bottom-center, for app-level messages (a failed
 * load, or a note with an action like Undo/Retry). Subscribes to the toast bus.
 * Messages are QUEUED and shown one at a time for 6s each — so a follow-up toast
 * (e.g. "Copied") can't clobber an actionable one (e.g. "Sticky deleted · Undo")
 * before the user acts on it. role=alert so assistive tech announces it. */
export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const queue = useRef<ToastPayload[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Show the next queued toast; when it expires, advance the queue. Reset the
    // timer marker to undefined when the queue drains so the next push re-pumps.
    const advance = () => {
      const next = queue.current.shift();
      setToast(next ?? null);
      timer.current = next ? setTimeout(advance, TOAST_MS) : undefined;
    };
    const off = onToast((t) => {
      queue.current.push(t);
      // Kick the pump only when idle; otherwise the current toast finishes first.
      if (!timer.current) advance();
    });
    return () => {
      off();
      clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, []);

  const dismiss = () => {
    clearTimeout(timer.current);
    const next = queue.current.shift();
    setToast(next ?? null);
    timer.current = next ? setTimeout(dismiss, TOAST_MS) : undefined;
  };

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
