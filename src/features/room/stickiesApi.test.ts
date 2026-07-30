import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listStickyByRoom, create, update, del, touchRoom } = vi.hoisted(() => ({
  listStickyByRoom: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  touchRoom: vi.fn(),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { listStickyByRoom, create, update, delete: del } } },
  unwrap: (r: { data: unknown }) => r.data,
}));
vi.mock('./touchRoom', () => ({ touchRoom }));

import { createSticky, deleteSticky, listStickiesByRoom, updateStickyContent } from './stickiesApi';

beforeEach(() => {
  [listStickyByRoom, create, update, del, touchRoom].forEach((m) => m.mockReset());
  touchRoom.mockResolvedValue(undefined);
});

describe('listStickiesByRoom', () => {
  it('returns stickies sorted oldest-first', async () => {
    listStickyByRoom.mockResolvedValue({
      data: [
        { id: 'b', createdAt: '2026-01-02Z' },
        { id: 'a', createdAt: '2026-01-01Z' },
      ],
    });
    const out = await listStickiesByRoom('room');
    expect(out.map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('createSticky', () => {
  it('creates with a rotated color and touches the room with the new count', async () => {
    create.mockResolvedValue({ data: { id: 'new' } });
    await createSticky({ room: 'room', kind: 'TEXT', content: 'hi', existingCount: 1 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ room: 'room', kind: 'TEXT', content: 'hi', color: 'pink' }),
    );
    expect(touchRoom).toHaveBeenCalledWith('room', 2);
  });
});

describe('updateStickyContent', () => {
  it('updates content and re-touches the room with the unchanged count', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await updateStickyContent('x', 'room', 'edited', 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', content: 'edited' });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });
});

describe('deleteSticky', () => {
  it('deletes and re-touches the room with the reduced count', async () => {
    del.mockResolvedValue({ data: {} });
    await deleteSticky('x', 'room', 2);
    expect(del).toHaveBeenCalledWith({ id: 'x' });
    expect(touchRoom).toHaveBeenCalledWith('room', 2);
  });
});
