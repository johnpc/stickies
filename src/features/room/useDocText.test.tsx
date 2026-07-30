import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { resolveMediaUrl } = vi.hoisted(() => ({ resolveMediaUrl: vi.fn() }));
vi.mock('./mediaApi', () => ({ resolveMediaUrl }));

import { useDocText } from './useDocText';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  resolveMediaUrl.mockReset();
  vi.unstubAllGlobals();
});

describe('useDocText', () => {
  it('resolves the URL then fetches the text body', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('hello world') }),
    );
    const { result } = renderHook(() => useDocText('rooms/r/1-a.txt'), { wrapper });
    await waitFor(() => expect(result.current.text).toBe('hello world'));
  });

  it('surfaces an error when the fetch is not ok', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const { result } = renderHook(() => useDocText('rooms/r/1-a.txt'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
