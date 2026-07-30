import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { listRecentRooms } = vi.hoisted(() => ({ listRecentRooms: vi.fn() }));
vi.mock('./recentsApi', () => ({ listRecentRooms }));

import { useRecentRooms } from './useRecentRooms';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => listRecentRooms.mockReset());

describe('useRecentRooms', () => {
  it('exposes fetched rooms once loaded', async () => {
    listRecentRooms.mockResolvedValue([{ id: 'a', slug: 'a' }]);
    const { result } = renderHook(() => useRecentRooms(10), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rooms).toEqual([{ id: 'a', slug: 'a' }]);
    expect(result.current.isError).toBe(false);
  });

  it('defaults to an empty list on the initial render', () => {
    // Resolve to empty so no fetch stays pending (a never-resolving promise
    // leaks an open handle and hangs vitest teardown).
    listRecentRooms.mockResolvedValue([]);
    const { result } = renderHook(() => useRecentRooms(10), { wrapper });
    expect(result.current.rooms).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
