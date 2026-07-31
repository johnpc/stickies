import { useCallback, useEffect, useRef, useState } from 'react';
import { onToast, type ToastPayload } from './toastBus';

const TOAST_MS = 6000;

/**
 * The toast queue + lifecycle, split out of the Toast component so it stays a
 * pure renderer. Messages show one at a time; a plain toast auto-expires after
 * 6s, an ACTIONABLE toast (Undo/Retry) waits for the user so it can't silently
 * vanish. Returns the current toast and an `advance` that also serves as
 * dismiss. Focus management (moving to / restoring from the action) lives in the
 * component, since it needs the rendered button.
 */
export function useToastQueue(onLeaveActionable?: () => void): {
  toast: ToastPayload | null;
  advance: () => void;
} {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const queue = useRef<ToastPayload[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showing = useRef(false);
  const wasActionable = useRef(false);

  const advance = useCallback(() => {
    clearTimeout(timer.current);
    const leftActionable = wasActionable.current;
    const next = queue.current.shift() ?? null;
    showing.current = !!next;
    wasActionable.current = !!next?.action;
    setToast(next);
    timer.current = next && !next.action ? setTimeout(advance, TOAST_MS) : undefined;
    // When an actionable toast closes and nothing replaces it, let the component
    // put focus back where it was (don't strand a keyboard user on <body>).
    if (leftActionable && !next) onLeaveActionable?.();
  }, [onLeaveActionable]);

  useEffect(() => {
    const off = onToast((t) => {
      queue.current.push(t);
      // Pump only when nothing is showing; otherwise the visible toast (which may
      // be an actionable one with no timer) must finish/be acted on first.
      if (!showing.current) advance();
    });
    return () => {
      off();
      clearTimeout(timer.current);
    };
  }, [advance]);

  return { toast, advance };
}
