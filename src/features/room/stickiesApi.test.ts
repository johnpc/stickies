import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listStickyByRoom, create, update, del, touchRoom, removeMedia } = vi.hoisted(() => ({
  listStickyByRoom: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  touchRoom: vi.fn(),
  removeMedia: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { listStickyByRoom, create, update, delete: del } } },
  unwrap: (r: { data: unknown }) => r.data,
}));
vi.mock('./touchRoom', () => ({ touchRoom }));
vi.mock('./mediaApi', () => ({ removeMedia }));

import { createSticky, deleteSticky, listStickiesByRoom, updateStickyContent } from './stickiesApi';

beforeEach(() => {
  [listStickyByRoom, create, update, del, touchRoom, removeMedia].forEach((m) => m.mockReset());
  touchRoom.mockResolvedValue(undefined);
  removeMedia.mockResolvedValue(undefined);
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
  it('creates with a seq-derived color + ord and touches the room with the new count', async () => {
    create.mockResolvedValue({ data: { id: 'new' } });
    // seq=1 → colorForIndex(1)='pink', ord=1 (seq drives both, not the count).
    await createSticky({ room: 'room', kind: 'TEXT', content: 'hi', seq: 1, existingCount: 1 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ room: 'room', kind: 'TEXT', content: 'hi', color: 'pink', ord: 1 }),
    );
    expect(touchRoom).toHaveBeenCalledWith('room', 2);
  });
});

describe('updateStickyContent', () => {
  it('writes the reclassified kind/content/language and re-touches the room', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await updateStickyContent('x', 'room', { kind: 'LINK', content: 'example.com' }, 5);
    expect(update).toHaveBeenCalledWith({
      id: 'x',
      kind: 'LINK',
      content: 'example.com',
      language: null,
    });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });

  it('writes the CODE language when present', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await updateStickyContent('x', 'room', { kind: 'CODE', content: 'x=1', language: 'py' }, 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', kind: 'CODE', content: 'x=1', language: 'py' });
  });
});

describe('deleteSticky', () => {
  it('deletes only the row (keeps the S3 object so delete stays undoable)', async () => {
    del.mockResolvedValue({ data: {} });
    await deleteSticky('m', 'room', 1);
    expect(del).toHaveBeenCalledWith({ id: 'm' });
    expect(touchRoom).toHaveBeenCalledWith('room', 1);
    expect(removeMedia).not.toHaveBeenCalled();
  });
});
