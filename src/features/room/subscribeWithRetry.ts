interface Subscription {
  unsubscribe: () => void;
}
interface Observer<T> {
  next: (value: T) => void;
  error?: (err: unknown) => void;
}
interface Observable<T> {
  subscribe: (observer: Observer<T>) => Subscription;
}

/**
 * Subscribe to an Amplify `observeQuery` (or any Observable) and SELF-HEAL on a
 * terminal error. AppSync subscriptions die on a network flap, token expiry, or
 * mobile backgrounding; wiring only `next` (as the room + presence live-sync did)
 * means that death is silent — the pad just stops receiving others' edits with no
 * signal or recovery, breaking the whole shared-pad promise. Here an `error`
 * tears the dead subscription down and re-subscribes after `delayMs`; a fresh
 * observeQuery re-delivers the current snapshot, so state re-syncs after the gap.
 * Returns a teardown that stops retries and unsubscribes. Injectable + testable.
 */
export function subscribeWithRetry<T>(
  observe: () => Observable<T>,
  onNext: (value: T) => void,
  opts: { onError?: (err: unknown) => void; delayMs?: number } = {},
): () => void {
  const delayMs = opts.delayMs ?? 3000;
  let sub: Subscription | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const start = () => {
    if (stopped) return;
    sub = observe().subscribe({
      next: onNext,
      error: (err) => {
        opts.onError?.(err);
        sub = null;
        timer = setTimeout(start, delayMs);
      },
    });
  };
  start();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    sub?.unsubscribe();
  };
}
