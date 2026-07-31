import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('../features/shell/toastBus', () => ({ showToast }));

// Import AFTER the mock so the module's MutationCache uses the spy.
import { queryClient } from './queryClient';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

beforeEach(() => showToast.mockClear());

describe('queryClient global mutation onError (fallback toast)', () => {
  it('shows a generic toast for a mutation with NO onError of its own', async () => {
    const { result } = renderHook(
      () => useMutation({ mutationFn: () => Promise.reject(new Error('boom')) }),
      { wrapper },
    );
    result.current.mutate(undefined);
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
  });

  it('does NOT double-toast when the mutation reports its own error (onError set)', async () => {
    // Mirrors the sticky writes: they set onError (notifyWriteError). The global
    // fallback must stay silent so a failed write shows ONE toast, not two.
    const own = vi.fn();
    const { result } = renderHook(
      () => useMutation({ mutationFn: () => Promise.reject(new Error('boom')), onError: own }),
      { wrapper },
    );
    result.current.mutate(undefined);
    await waitFor(() => expect(own).toHaveBeenCalledTimes(1));
    expect(showToast).not.toHaveBeenCalled();
  });
});
