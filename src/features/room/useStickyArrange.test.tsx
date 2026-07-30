import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { setStickyColor, setStickyOrder } = vi.hoisted(() => ({
  setStickyColor: vi.fn().mockResolvedValue({}),
  setStickyOrder: vi.fn().mockResolvedValue({}),
}));
vi.mock('./stickiesApi', () => ({ setStickyColor, setStickyOrder }));

import { useStickyArrange } from './useStickyArrange';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() => [setStickyColor, setStickyOrder].forEach((m) => m.mockClear()));

describe('useStickyArrange', () => {
  it('recolors a sticky', async () => {
    const { result } = renderHook(() => useStickyArrange('room', 4), { wrapper });
    act(() => result.current.recolor.mutate({ id: 'x', color: 'pink' }));
    await waitFor(() => expect(setStickyColor).toHaveBeenCalledWith('x', 'room', 'pink', 4));
  });

  it('reorders a sticky', async () => {
    const { result } = renderHook(() => useStickyArrange('room', 4), { wrapper });
    act(() => result.current.reorder.mutate({ id: 'x', ord: 1.5 }));
    await waitFor(() => expect(setStickyOrder).toHaveBeenCalledWith('x', 'room', 1.5, 4));
  });
});
