import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { onToast as subscribeToast } from '../shell/toastBus';

const { createSticky, updateStickyContent, deleteSticky, restoreSticky, createMediaSticky } =
  vi.hoisted(() => ({
    createSticky: vi.fn().mockResolvedValue({}),
    updateStickyContent: vi.fn().mockResolvedValue({}),
    deleteSticky: vi.fn().mockResolvedValue(undefined),
    restoreSticky: vi.fn().mockResolvedValue(undefined),
    createMediaSticky: vi.fn().mockResolvedValue({}),
  }));
vi.mock('./stickiesApi', () => ({ createSticky, updateStickyContent, deleteSticky }));
vi.mock('./restoreSticky', () => ({ restoreSticky }));
vi.mock('./createMediaSticky', () => ({ createMediaSticky }));

import { useStickyMutations } from './useStickyMutations';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() =>
  [createSticky, updateStickyContent, deleteSticky, restoreSticky, createMediaSticky].forEach((m) =>
    m.mockClear(),
  ),
);

describe('useStickyMutations', () => {
  it('adds a sticky, detecting its kind and passing the current count', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 2), { wrapper });
    act(() => result.current.add.mutate('example.com'));
    await waitFor(() => expect(createSticky).toHaveBeenCalled());
    expect(createSticky).toHaveBeenCalledWith({
      room: 'room',
      kind: 'LINK',
      content: 'example.com',
      language: undefined,
      seq: expect.any(Number),
      existingCount: 2,
    });
  });

  it('adds a fenced snippet as a CODE sticky with its language', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 0), { wrapper });
    act(() => result.current.add.mutate('```ts\nconst a = 1;\n```'));
    await waitFor(() => expect(createSticky).toHaveBeenCalled());
    expect(createSticky).toHaveBeenCalledWith({
      room: 'room',
      kind: 'CODE',
      content: 'const a = 1;',
      language: 'ts',
      seq: expect.any(Number),
      existingCount: 0,
    });
  });

  it('uploads a media sticky through createMediaSticky', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 1), { wrapper });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    act(() => result.current.addMedia.mutate({ file, seed: 99 }));
    await waitFor(() => expect(createMediaSticky).toHaveBeenCalled());
    expect(createMediaSticky).toHaveBeenCalledWith({
      room: 'room',
      file,
      existingCount: 1,
      seed: 99,
    });
  });

  it('edits a sticky, reclassifying plain text', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.edit.mutate({ id: 'x', content: 'new' }));
    await waitFor(() =>
      expect(updateStickyContent).toHaveBeenCalledWith(
        'x',
        'room',
        { kind: 'TEXT', content: 'new', language: undefined },
        3,
      ),
    );
  });

  it('reclassifies an edit into a URL as a LINK', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.edit.mutate({ id: 'x', content: 'example.com' }));
    await waitFor(() =>
      expect(updateStickyContent).toHaveBeenCalledWith(
        'x',
        'room',
        { kind: 'LINK', content: 'example.com', language: undefined },
        3,
      ),
    );
  });

  it('deletes a sticky with the reduced count and offers an Undo toast', async () => {
    const onToast = vi.fn();
    const off = subscribeToast(onToast);
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() =>
      result.current.remove.mutate({ id: 'x', kind: 'TEXT', content: 'hi' } as StickyRecord),
    );
    await waitFor(() => expect(deleteSticky).toHaveBeenCalledWith('x', 'room', 2));
    await waitFor(() => expect(onToast).toHaveBeenCalled());
    const payload = onToast.mock.calls[0][0];
    expect(payload.message).toMatch(/deleted/i);
    expect(payload.action?.label).toBe('Undo');
    off();
  });

  it('surfaces a retryable toast when a write rejects (offline = no silent loss)', async () => {
    createSticky.mockRejectedValueOnce(new Error('Request timed out — check your connection.'));
    const onToast = vi.fn();
    const off = subscribeToast(onToast);
    const { result } = renderHook(() => useStickyMutations('room', 0), { wrapper });
    act(() => result.current.add.mutate('hi'));
    await waitFor(() => expect(onToast).toHaveBeenCalled());
    const payload = onToast.mock.calls[0][0];
    expect(payload.message).toMatch(/timed out/i);
    expect(payload.action?.label).toBe('Retry');
    // Retry re-fires the same write.
    createSticky.mockResolvedValueOnce({});
    act(() => payload.action!.run());
    await waitFor(() => expect(createSticky).toHaveBeenCalledTimes(2));
    off();
  });

  it('restores the sticky when Undo is invoked', async () => {
    let undo: (() => void) | undefined;
    const off = subscribeToast((t) => {
      undo = t.action?.run;
    });
    const sticky = { id: 'x', room: 'room', kind: 'TEXT', content: 'hi' } as StickyRecord;
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.remove.mutate(sticky));
    await waitFor(() => expect(undo).toBeTypeOf('function'));
    act(() => undo!());
    await waitFor(() => expect(restoreSticky).toHaveBeenCalledWith(sticky, 'room', 4));
    off();
  });
});
