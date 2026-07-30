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

import {
  createSticky,
  deleteSticky,
  listStickiesByRoom,
  setStickyColor,
  setStickyOrder,
  updateStickyContent,
} from './stickiesApi';

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

describe('setStickyColor', () => {
  it('updates only the color and re-touches the room', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await setStickyColor('x', 'room', 'blue', 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', color: 'blue' });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });
});

describe('setStickyOrder', () => {
  it('updates only the ord and re-touches the room', async () => {
    update.mockResolvedValue({ data: { id: 'x' } });
    await setStickyOrder('x', 'room', 1.5, 5);
    expect(update).toHaveBeenCalledWith({ id: 'x', ord: 1.5 });
    expect(touchRoom).toHaveBeenCalledWith('room', 5);
  });
});

describe('deleteSticky', () => {
  it('deletes and re-touches the room with the reduced count', async () => {
    del.mockResolvedValue({ data: {} });
    await deleteSticky('x', 'room', 2);
    expect(del).toHaveBeenCalledWith({ id: 'x' });
    expect(touchRoom).toHaveBeenCalledWith('room', 2);
    expect(removeMedia).not.toHaveBeenCalled();
  });

  it('cleans up the S3 object when a media path is given', async () => {
    del.mockResolvedValue({ data: {} });
    await deleteSticky('m', 'room', 1, 'rooms/room/1-a.png');
    expect(removeMedia).toHaveBeenCalledWith('rooms/room/1-a.png');
  });

  it('still deletes the row when S3 cleanup fails (best-effort)', async () => {
    del.mockResolvedValue({ data: {} });
    removeMedia.mockRejectedValue(new Error('gone'));
    await deleteSticky('m', 'room', 1, 'rooms/room/1-a.png');
    expect(del).toHaveBeenCalledWith({ id: 'm' });
    expect(touchRoom).toHaveBeenCalledWith('room', 1);
  });
});
