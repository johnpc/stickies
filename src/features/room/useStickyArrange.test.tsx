import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { roomStickiesKey } from './roomStickiesKey';

const { setStickyColor, setStickySize, setStickyOrder } = vi.hoisted(() => ({
  setStickyColor: vi.fn().mockResolvedValue({}),
  setStickySize: vi.fn().mockResolvedValue({}),
  setStickyOrder: vi.fn().mockResolvedValue({}),
}));
vi.mock('./stickyArrangeApi', () => ({ setStickyColor, setStickySize, setStickyOrder }));

import { useStickyArrange } from './useStickyArrange';

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const cache = () => client.getQueryData<StickyRecord[]>(roomStickiesKey('room'));
const seed = (stickies: Partial<StickyRecord>[]) =>
  client.setQueryData(roomStickiesKey('room'), stickies as StickyRecord[]);

beforeEach(() => {
  [setStickyColor, setStickySize, setStickyOrder].forEach((m) => m.mockReset());
  [setStickyColor, setStickySize, setStickyOrder].forEach((m) => m.mockResolvedValue({}));
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
});

describe('useStickyArrange', () => {
  it('recolors a sticky', async () => {
    const { result } = renderHook(() => useStickyArrange('room', 4), { wrapper });
    act(() => result.current.recolor.mutate({ id: 'x', color: 'pink' }));
    await waitFor(() => expect(setStickyColor).toHaveBeenCalledWith('x', 'room', 'pink', 4));
  });

  it('resizes a sticky', async () => {
    const { result } = renderHook(() => useStickyArrange('room', 4), { wrapper });
    act(() => result.current.resize.mutate({ id: 'x', size: 'L' }));
    await waitFor(() => expect(setStickySize).toHaveBeenCalledWith('x', 'room', 'L', 4));
  });

  it('reorders a sticky', async () => {
    const { result } = renderHook(() => useStickyArrange('room', 4), { wrapper });
    act(() => result.current.reorder.mutate({ id: 'x', ord: 1.5 }));
    await waitFor(() => expect(setStickyOrder).toHaveBeenCalledWith('x', 'room', 1.5, 4));
  });

  it('optimistically patches size in the cache before the write resolves', () => {
    seed([{ id: 'x', size: 'M', color: 'yellow' } as StickyRecord]);
    const { result } = renderHook(() => useStickyArrange('room', 1), { wrapper });
    act(() => result.current.resize.mutate({ id: 'x', size: 'L' }));
    // The cache reflects L immediately (synchronously in onMutate) — a rapid
    // second tap now reads L and advances the cycle, instead of re-writing from M.
    expect(cache()?.find((s) => s.id === 'x')?.size).toBe('L');
  });

  it('optimistically patches color and leaves other stickies untouched', () => {
    seed([
      { id: 'x', color: 'yellow' } as StickyRecord,
      { id: 'y', color: 'blue' } as StickyRecord,
    ]);
    const { result } = renderHook(() => useStickyArrange('room', 2), { wrapper });
    act(() => result.current.recolor.mutate({ id: 'x', color: 'pink' }));
    expect(cache()?.find((s) => s.id === 'x')?.color).toBe('pink');
    expect(cache()?.find((s) => s.id === 'y')?.color).toBe('blue');
  });

  it('rolls back the optimistic patch when the write fails', async () => {
    setStickySize.mockRejectedValueOnce(new Error('offline'));
    seed([{ id: 'x', size: 'M' } as StickyRecord]);
    const { result } = renderHook(() => useStickyArrange('room', 1), { wrapper });
    act(() => result.current.resize.mutate({ id: 'x', size: 'L' }));
    expect(cache()?.find((s) => s.id === 'x')?.size).toBe('L'); // optimistic
    // On failure the cache reverts to the prior size (no wrong size left showing).
    await waitFor(() => expect(cache()?.find((s) => s.id === 'x')?.size).toBe('M'));
  });
});
