import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { createSticky, updateStickyContent, deleteSticky } = vi.hoisted(() => ({
  createSticky: vi.fn().mockResolvedValue({}),
  updateStickyContent: vi.fn().mockResolvedValue({}),
  deleteSticky: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./stickiesApi', () => ({ createSticky, updateStickyContent, deleteSticky }));

import { useStickyMutations } from './useStickyMutations';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() => [createSticky, updateStickyContent, deleteSticky].forEach((m) => m.mockClear()));

describe('useStickyMutations', () => {
  it('adds a sticky, detecting its kind and passing the current count', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 2), { wrapper });
    act(() => result.current.add.mutate('example.com'));
    await waitFor(() => expect(createSticky).toHaveBeenCalled());
    expect(createSticky).toHaveBeenCalledWith({
      room: 'room',
      kind: 'LINK',
      content: 'example.com',
      existingCount: 2,
    });
  });

  it('edits a sticky', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.edit.mutate({ id: 'x', content: 'new' }));
    await waitFor(() => expect(updateStickyContent).toHaveBeenCalledWith('x', 'room', 'new', 3));
  });

  it('deletes a sticky with the reduced remaining count', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.remove.mutate('x'));
    await waitFor(() => expect(deleteSticky).toHaveBeenCalledWith('x', 'room', 2));
  });
});
