import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { resolveMediaUrl } = vi.hoisted(() => ({ resolveMediaUrl: vi.fn() }));
vi.mock('./mediaApi', () => ({ resolveMediaUrl }));

import { useMediaUrl } from './useMediaUrl';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => resolveMediaUrl.mockReset());

describe('useMediaUrl', () => {
  it('resolves the signed URL for a key', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/x');
    const { result } = renderHook(() => useMediaUrl('rooms/r/1-a.png'), { wrapper });
    await waitFor(() => expect(result.current.url).toBe('https://s3.example/x'));
  });

  it('does not fetch for an empty key', () => {
    renderHook(() => useMediaUrl(''), { wrapper });
    expect(resolveMediaUrl).not.toHaveBeenCalled();
  });

  it('refresh() forces an immediate re-sign (recovers an expired URL on error)', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/x');
    const { result } = renderHook(() => useMediaUrl('rooms/r/1-a.png'), { wrapper });
    await waitFor(() => expect(resolveMediaUrl).toHaveBeenCalledTimes(1));
    result.current.refresh();
    await waitFor(() => expect(resolveMediaUrl.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('re-signs the URL on an interval so it never rots past S3 expiry', async () => {
    vi.useFakeTimers();
    try {
      resolveMediaUrl.mockResolvedValue('https://s3.example/x');
      // A fresh client so this hook's refetchInterval isn't affected by others.
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const localWrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      renderHook(() => useMediaUrl('rooms/r/1-a.png'), { wrapper: localWrapper });
      await vi.waitFor(() => expect(resolveMediaUrl).toHaveBeenCalledTimes(1));
      // Advance past the 10-minute refresh interval → it re-signs.
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000 + 1000);
      expect(resolveMediaUrl.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
