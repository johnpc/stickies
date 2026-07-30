import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { fetchLinkPreview } = vi.hoisted(() => ({ fetchLinkPreview: vi.fn() }));
vi.mock('./linkPreviewApi', () => ({ fetchLinkPreview }));

import { useLinkPreview } from './useLinkPreview';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => fetchLinkPreview.mockReset());

describe('useLinkPreview', () => {
  it('fetches the preview when enabled', async () => {
    fetchLinkPreview.mockResolvedValue({
      title: 'T',
      description: null,
      image: null,
      siteName: null,
    });
    const { result } = renderHook(() => useLinkPreview('https://x', true), { wrapper });
    await waitFor(() => expect(result.current.preview?.title).toBe('T'));
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useLinkPreview('https://x', false), { wrapper });
    expect(fetchLinkPreview).not.toHaveBeenCalled();
  });
});
