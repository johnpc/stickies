import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from './withTimeout';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('propagates a rejection from the underlying promise', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });

  it('rejects when the promise hangs past the timeout', async () => {
    const hang = new Promise(() => {}); // never settles (an offline Amplify write)
    const p = withTimeout(hang, 5000);
    const assertion = expect(p).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });
});
