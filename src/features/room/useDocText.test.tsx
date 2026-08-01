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

  it('flags truncated when the file exceeds the read cap', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
    // No `body` stream → readCappedText uses res.text(); a >256KB string is capped.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('a'.repeat(300 * 1024)) }),
    );
    const { result } = renderHook(() => useDocText('rooms/r/1-big.log'), { wrapper });
    await waitFor(() => expect(result.current.truncated).toBe(true));
    expect(result.current.text?.length).toBe(256 * 1024);
  });

  it('surfaces an error when the fetch is not ok', async () => {
    resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const { result } = renderHook(() => useDocText('rooms/r/1-a.txt'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('recovers via retry() after a transient failure (re-signs + re-fetches)', async () => {
    // A doc preview reads its text through a signed S3 URL that expires; with
    // retry:false there was no recovery, so a transient 403 stayed broken until a
    // full reload. retry() must re-run the query and pick up a now-good response.
    resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 403 }) // expired URL
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('recovered text') });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useDocText('rooms/r/1-a.txt'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    result.current.retry();
    await waitFor(() => expect(result.current.text).toBe('recovered text'));
    expect(result.current.isError).toBe(false);
  });

  it('errors out instead of hanging forever when the fetch never settles', async () => {
    vi.useFakeTimers();
    try {
      resolveMediaUrl.mockResolvedValue('https://s3.example/doc');
      // A fetch that never resolves (a stalled S3 GET).
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise(() => {})),
      );
      const { result } = renderHook(() => useDocText('rooms/r/1-a.txt'), { wrapper });
      // Let the query start + resolveMediaUrl settle, then blow past the 15s timeout.
      await vi.advanceTimersByTimeAsync(16_000);
      await vi.waitFor(() => expect(result.current.isError).toBe(true));
    } finally {
      vi.useRealTimers();
    }
  });
});
