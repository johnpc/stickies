import { useEffect, useState } from 'react';
import { onToast, type ToastPayload } from './toastBus';
import './Toast.css';

/** A single transient toast, bottom-center, for app-level messages (a failed
 * load, or a note with an action like Retry). Subscribes to the toast bus; each
 * message shows for 6s then auto-dismisses. role=alert so assistive tech
 * announces it. An optional action button runs its handler then dismisses. */
export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const off = onToast((t) => {
      setToast(t);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 6000);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

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
            setToast(null);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="sk-toast__close" aria-label="Dismiss" onClick={() => setToast(null)}>
        ×
      </button>
    </div>
  );
}
