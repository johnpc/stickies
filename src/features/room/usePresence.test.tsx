import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { observeQuery, subscribe, unsubscribe, heartbeat, clearPresence, reapPresence } = vi.hoisted(
  () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => ({ unsubscribe }));
    return {
      observeQuery: vi.fn(() => ({ subscribe })),
      subscribe,
      unsubscribe,
      heartbeat: vi.fn().mockResolvedValue(undefined),
      clearPresence: vi.fn().mockResolvedValue(undefined),
      reapPresence: vi.fn().mockResolvedValue(undefined),
    };
  },
);
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Presence: { observeQuery } } },
}));
vi.mock('./presenceApi', () => ({ heartbeat, clearPresence, reapPresence }));
vi.mock('./sessionId', () => ({ getSessionId: () => 'sess-test' }));

import { usePresence } from './usePresence';

beforeEach(() => {
  vi.useFakeTimers();
  [observeQuery, subscribe, unsubscribe, heartbeat, clearPresence, reapPresence].forEach((m) =>
    m.mockClear(),
  );
});
afterEach(() => {
  vi.useRealTimers();
});

describe('usePresence', () => {
  it('heartbeats on mount, counts fresh rows from the subscription, cleans up on unmount', async () => {
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
    // leave() awaits the in-flight heartbeat before deleting (delete-after-create),
    // so flush microtasks for the chained clearPresence to fire.
    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(clearPresence).toHaveBeenCalledWith('sess-test');
  });

  it('deletes our row only AFTER the in-flight heartbeat settles (no phantom on quick leave)', async () => {
    // The race: mount fires heartbeat (get→create, slow); unmount fires the
    // delete (fast). Run independently, the delete can land before the create,
    // stranding a phantom row others count as "here" for ~30s. So clearPresence
    // must NOT be called until the pending heartbeat resolves.
    let resolveBeat: () => void = () => {};
    heartbeat.mockImplementationOnce(
      () =>
        new Promise<void>((res) => {
          resolveBeat = res;
        }),
    );
    const { unmount } = renderHook(() => usePresence('room'));
    expect(heartbeat).toHaveBeenCalledTimes(1);

    // Leave while the heartbeat is still in flight — the delete must be deferred.
    unmount();
    await Promise.resolve();
    expect(clearPresence).not.toHaveBeenCalled();

    // Once the heartbeat settles, the delete fires (delete-after-create). Flush
    // several microtasks: the chain is heartbeat().catch() → beating.then(delete).
    await act(async () => {
      resolveBeat();
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(clearPresence).toHaveBeenCalledWith('sess-test');
  });

  it('does nothing without a room', () => {
    renderHook(() => usePresence(''));
    expect(observeQuery).not.toHaveBeenCalled();
    expect(heartbeat).not.toHaveBeenCalled();
  });

  it('reaps long-dead rows from a snapshot but leaves fresh ones', () => {
    renderHook(() => usePresence('room'));
    const fresh = new Date().toISOString();
    const dead = new Date(Date.now() - 10 * 60_000).toISOString(); // 10 min old
    const call = subscribe.mock.calls[0] as unknown as [{ next: (arg: unknown) => void }];
    act(() =>
      call[0].next({
        items: [
          { id: 'live', room: 'room', heartbeatAt: fresh },
          { id: 'ghost', room: 'room', heartbeatAt: dead },
        ],
      }),
    );
    expect(reapPresence).toHaveBeenCalledWith('ghost');
    expect(reapPresence).not.toHaveBeenCalledWith('live');
  });
});
