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
  unwrapWrite: (r: { data: unknown }) => r.data,
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
  it('colors by existingCount (matches the composer preview) and orders by seq', async () => {
    create.mockResolvedValue({ data: { id: 'new' } });
    // ord comes from seq (monotonic append); color from existingCount so it
    // matches the composer's colorForIndex(count) preview. Distinct values here
    // prove the color follows the count, not the seq: seq=1 would be 'pink',
    // existingCount=2 → colorForIndex(2)='blue'.
    await createSticky({ room: 'room', kind: 'TEXT', content: 'hi', seq: 1, existingCount: 2 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ room: 'room', kind: 'TEXT', content: 'hi', color: 'blue', ord: 1 }),
    );
    expect(touchRoom).toHaveBeenCalledWith('room', 3);
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

  it('rejects (does not hang) when the delete never settles — offline', async () => {
    // Regression: delete was the one write not raced against withTimeout, so an
    // offline delete hung forever with no error/undo toast and the sticky stuck
    // on screen. It must time out like the other writes.
    vi.useFakeTimers();
    try {
      del.mockReturnValue(new Promise(() => {})); // never resolves
      const p = deleteSticky('m', 'room', 1);
      const assertion = expect(p).rejects.toThrow(/timed out/i);
      await vi.advanceTimersByTimeAsync(12_001);
      await assertion;
      expect(touchRoom).not.toHaveBeenCalled(); // never reached the recents bump
    } finally {
      vi.useRealTimers();
    }
  });
});
