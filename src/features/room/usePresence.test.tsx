import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { observeQuery, subscribe, unsubscribe, heartbeat, clearPresence } = vi.hoisted(() => {
  const unsubscribe = vi.fn();
  const subscribe = vi.fn(() => ({ unsubscribe }));
  return {
    observeQuery: vi.fn(() => ({ subscribe })),
    subscribe,
    unsubscribe,
    heartbeat: vi.fn().mockResolvedValue(undefined),
    clearPresence: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Presence: { observeQuery } } },
}));
vi.mock('./presenceApi', () => ({ heartbeat, clearPresence }));
vi.mock('./sessionId', () => ({ getSessionId: () => 'sess-test' }));

import { usePresence } from './usePresence';

beforeEach(() => {
  vi.useFakeTimers();
  [observeQuery, subscribe, unsubscribe, heartbeat, clearPresence].forEach((m) => m.mockClear());
});
afterEach(() => {
  vi.useRealTimers();
});

describe('usePresence', () => {
  it('heartbeats on mount, counts fresh rows from the subscription, cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => usePresence('room'));
    expect(heartbeat).toHaveBeenCalledWith('sess-test', 'room', expect.any(String));
    expect(observeQuery).toHaveBeenCalledWith({ filter: { room: { eq: 'room' } } });

    // Feed two fresh presence rows through the subscription.
    const now = new Date().toISOString();
    const call = subscribe.mock.calls[0] as unknown as [{ next: (arg: unknown) => void }];
    act(() =>
      call[0].next({
        items: [
          { id: 'a', room: 'room', heartbeatAt: now },
          { id: 'b', room: 'room', heartbeatAt: now },
        ],
      }),
    );
    expect(result.current).toBe(2);

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
    expect(clearPresence).toHaveBeenCalledWith('sess-test');
  });

  it('does nothing without a room', () => {
    renderHook(() => usePresence(''));
    expect(observeQuery).not.toHaveBeenCalled();
    expect(heartbeat).not.toHaveBeenCalled();
  });
});
