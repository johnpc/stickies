import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { StickyRecord } from '../../lib/dataClient';

const { createSticky, updateStickyContent, deleteSticky, createMediaSticky } = vi.hoisted(() => ({
  createSticky: vi.fn().mockResolvedValue({}),
  updateStickyContent: vi.fn().mockResolvedValue({}),
  deleteSticky: vi.fn().mockResolvedValue(undefined),
  createMediaSticky: vi.fn().mockResolvedValue({}),
}));
vi.mock('./stickiesApi', () => ({ createSticky, updateStickyContent, deleteSticky }));
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
  [createSticky, updateStickyContent, deleteSticky, createMediaSticky].forEach((m) =>
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

  it('edits a sticky', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() => result.current.edit.mutate({ id: 'x', content: 'new' }));
    await waitFor(() => expect(updateStickyContent).toHaveBeenCalledWith('x', 'room', 'new', 3));
  });

  it('deletes a text sticky with the reduced count and no media path', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    act(() =>
      result.current.remove.mutate({ id: 'x', kind: 'TEXT', content: 'hi' } as StickyRecord),
    );
    await waitFor(() => expect(deleteSticky).toHaveBeenCalledWith('x', 'room', 2, undefined));
  });

  it('passes the S3 path when deleting a media sticky (so it cleans up)', async () => {
    const { result } = renderHook(() => useStickyMutations('room', 3), { wrapper });
    const media = { id: 'm', kind: 'IMAGE', content: 'rooms/room/1-a.png' } as StickyRecord;
    act(() => result.current.remove.mutate(media));
    await waitFor(() =>
      expect(deleteSticky).toHaveBeenCalledWith('m', 'room', 2, 'rooms/room/1-a.png'),
    );
  });
});
