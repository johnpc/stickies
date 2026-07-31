import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

const { create, touchRoom } = vi.hoisted(() => ({ create: vi.fn(), touchRoom: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { create } } },
  unwrap: (r: { data: unknown }) => r.data,
  unwrapWrite: (r: { data: unknown }) => r.data,
}));
vi.mock('./touchRoom', () => ({ touchRoom }));

import { restoreSticky } from './restoreSticky';

beforeEach(() => {
  create.mockReset();
  touchRoom.mockReset();
  touchRoom.mockResolvedValue(undefined);
});

describe('restoreSticky', () => {
  it('re-creates a deleted sticky with all its original fields', async () => {
    create.mockResolvedValue({ data: {} });
    const sticky = {
      id: 'old',
      room: 'room',
      kind: 'IMAGE',
      content: 'rooms/room/1-a.png',
      color: 'pink',
      size: 'L',
      ord: 3.5,
      fileName: 'a.png',
      mimeType: 'image/png',
    } as StickyRecord;
    await restoreSticky(sticky, 'room', 4);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        room: 'room',
        kind: 'IMAGE',
        content: 'rooms/room/1-a.png',
        color: 'pink',
        // Regression: size was dropped, so undoing a Large note brought it back Medium.
        size: 'L',
        ord: 3.5,
        fileName: 'a.png',
        mimeType: 'image/png',
      }),
    );
    expect(touchRoom).toHaveBeenCalledWith('room', 4);
  });

  it('preserves a Small size across the delete → undo round-trip (no silent shrink)', async () => {
    create.mockResolvedValue({ data: {} });
    const small = { id: 's', room: 'r', kind: 'TEXT', content: 'x', size: 'S' } as StickyRecord;
    await restoreSticky(small, 'r', 1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ size: 'S' }));
  });
});
