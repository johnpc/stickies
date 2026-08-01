import { useCallback, useEffect, useRef } from 'react';
import { useToastQueue } from './useToastQueue';
import './Toast.css';

/** A single transient toast, bottom-center, for app-level messages (a failed
 * load, or a note with an action like Undo/Retry). Queue + lifecycle live in
 * useToastQueue; this owns rendering + a11y focus.
 *
 * a11y: an actionable toast MOVES FOCUS to its action button (and is role=alert)
 * so a keyboard/screen-reader user actually reaches + hears "Undo" instead of it
 * being an unreachable, unannounced button at the end of the DOM; focus is
 * restored to wherever it was on dismiss. A plain toast is a polite role=status
 * that announces without stealing focus or interrupting (e.g. "Copied"). */
export function Toast() {
  const actionRef = useRef<HTMLButtonElement>(null);
  // Where focus was before an actionable toast grabbed it, to restore on close.
  const returnFocus = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const el = returnFocus.current;
    returnFocus.current = null;
    if (el?.isConnected) el.focus();
  }, []);

  const { toast, advance } = useToastQueue(restoreFocus);

  // When an actionable toast appears, pull focus to its action so it's reachable
  // and announced; remember where focus was so restoreFocus can put it back.
  useEffect(() => {
    if (toast?.action && actionRef.current) {
      // Capture the return target only if we don't already have one. Across a
      // CHAIN of actionable toasts (A→B→…) focus is on the previous action button
      // when the next appears; capturing that would restore to a detached node and
      // lose the real opener. returnFocus is cleared only by restoreFocus (when the
      // chain ends), so keeping the first-captured element anchors the whole chain.
      if (!returnFocus.current) returnFocus.current = document.activeElement as HTMLElement | null;
      actionRef.current.focus();
    }
  }, [toast]);

  if (!toast) return null;
  return (
    <div
      className="sk-toast"
      // Actionable → assertive (needs prompt action); plain → polite so a
      // confirmation doesn't interrupt a screen reader mid-sentence.
      role={toast.action ? 'alert' : 'status'}
      data-testid="app-toast"
    >
      <span className="sk-toast__msg">{toast.message}</span>
      {toast.action && (
        <button
          ref={actionRef}
          className="sk-toast__action"
          data-testid="app-toast-action"
          onClick={() => {
            toast.action?.run();
            advance();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="sk-toast__close" aria-label="Dismiss" onClick={advance}>
        ×
      </button>
    </div>
  );
}
