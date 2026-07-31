import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeWithRetry } from './subscribeWithRetry';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

/** A fake Observable whose latest observer is captured so tests can drive
 * next/error, plus a per-subscription unsubscribe spy. */
function makeObservable() {
  const unsubscribes: Array<() => void> = [];
  let observer: { next: (v: unknown) => void; error?: (e: unknown) => void } | null = null;
  const observable = {
    subscribe(o: { next: (v: unknown) => void; error?: (e: unknown) => void }) {
      observer = o;
      const unsubscribe = vi.fn();
      unsubscribes.push(unsubscribe);
      return { unsubscribe };
    },
  };
  return {
    observe: () => observable,
    get observer() {
      return observer;
    },
    unsubscribes,
  };
}

describe('subscribeWithRetry', () => {
  it('forwards next values', () => {
    const f = makeObservable();
    const onNext = vi.fn();
    subscribeWithRetry(f.observe, onNext);
    f.observer!.next('a');
    expect(onNext).toHaveBeenCalledWith('a');
  });

  it('re-subscribes after a terminal error so live sync self-heals', () => {
    const f = makeObservable();
    const onNext = vi.fn();
    const onError = vi.fn();
    subscribeWithRetry(f.observe, onNext, { onError, delayMs: 3000 });

    // First subscription dies (one subscription created so far).
    f.observer!.error!(new Error('socket closed'));
    expect(onError).toHaveBeenCalledOnce();
    expect(f.unsubscribes).toHaveLength(1); // no reconnect yet — waiting on backoff

    // After the backoff it re-subscribes (a 2nd subscription) and resumes.
    vi.advanceTimersByTime(3000);
    expect(f.unsubscribes).toHaveLength(2);
    f.observer!.next('after-reconnect');
    expect(onNext).toHaveBeenCalledWith('after-reconnect');
  });

  it('teardown stops retries and unsubscribes the live subscription', () => {
    const f = makeObservable();
    const stop = subscribeWithRetry(f.observe, vi.fn(), { delayMs: 3000 });
    stop();
    expect(f.unsubscribes[0]).toHaveBeenCalledOnce();

    // A late error after teardown must NOT schedule a reconnect.
    f.observer!.error?.(new Error('late'));
    vi.advanceTimersByTime(10000);
    expect(f.unsubscribes).toHaveLength(1);
  });
});
