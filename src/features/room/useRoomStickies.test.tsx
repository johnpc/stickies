import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { listStickiesByRoom, observeQuery, unsubscribe, subscribe } = vi.hoisted(() => {
  const unsubscribe = vi.fn();
  const subscribe = vi.fn(() => ({ unsubscribe }));
  return {
    listStickiesByRoom: vi.fn(),
    observeQuery: vi.fn(() => ({ subscribe })),
    unsubscribe,
    subscribe,
  };
});

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { observeQuery } } },
}));
vi.mock('./stickiesApi', () => ({ listStickiesByRoom }));

import { useRoomStickies } from './useRoomStickies';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  [listStickiesByRoom, observeQuery, unsubscribe, subscribe].forEach((m) => m.mockClear());
});

describe('useRoomStickies', () => {
  it('seeds from the fetch then lets the subscription push live updates into the cache', async () => {
    listStickiesByRoom.mockResolvedValue([{ id: '1', createdAt: '2026-01-01Z' }]);
    const { result } = renderHook(() => useRoomStickies('room'), { wrapper });
    await waitFor(() => expect(result.current.stickies).toHaveLength(1));

    // Simulate a live observeQuery snapshot (from anyone on the same URL).
    const call = subscribe.mock.calls[0] as unknown as [{ next: (arg: unknown) => void }];
    const onNext = call[0].next;
    onNext({
      items: [
        { id: '1', createdAt: '2026-01-01Z' },
        { id: '2', createdAt: '2026-01-02Z' },
      ],
    });
    await waitFor(() => expect(result.current.stickies).toHaveLength(2));
    expect(observeQuery).toHaveBeenCalledWith({ filter: { room: { eq: 'room' } } });
  });

  it('does not subscribe when the room slug is empty', () => {
    renderHook(() => useRoomStickies(''), { wrapper });
    expect(observeQuery).not.toHaveBeenCalled();
  });
});
