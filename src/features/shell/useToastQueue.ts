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
    // When we leave an actionable toast, hand focus back to where it was — so a
    // keyboard/AT user who deleted a sticky and hit Undo isn't stranded. This must
    // fire whether the queue is now empty OR a PLAIN toast follows (a plain toast
    // doesn't take focus, so nothing else will restore it). The only case we skip
    // is when the next toast is itself ACTIONABLE: it legitimately grabs focus and
    // records its own return target, so restoring here would fight it.
    if (leftActionable && !next?.action) onLeaveActionable?.();
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
