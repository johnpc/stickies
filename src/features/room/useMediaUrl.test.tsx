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
});
