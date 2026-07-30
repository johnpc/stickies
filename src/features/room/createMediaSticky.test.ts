import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, touchRoom, uploadMedia } = vi.hoisted(() => ({
  create: vi.fn(),
  touchRoom: vi.fn().mockResolvedValue(undefined),
  uploadMedia: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Sticky: { create } } },
  unwrap: (r: { data: unknown }) => r.data,
}));
vi.mock('./touchRoom', () => ({ touchRoom }));
vi.mock('./mediaApi', () => ({
  touchRoom,
  uploadMedia,
  mediaKey: (room: string, name: string, seed: number) => `rooms/${room}/${seed}-${name}`,
}));

import { createMediaSticky } from './createMediaSticky';

beforeEach(() => {
  create.mockReset();
  touchRoom.mockClear();
  uploadMedia.mockReset();
});

describe('createMediaSticky', () => {
  it('uploads the file then creates an IMAGE sticky pointing at its key', async () => {
    uploadMedia.mockResolvedValue('rooms/r/7-a.png');
    create.mockResolvedValue({ data: { id: 'new' } });
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    await createMediaSticky({ room: 'r', file, existingCount: 1, seed: 7 });

    expect(uploadMedia).toHaveBeenCalledWith('rooms/r/7-a.png', file);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        room: 'r',
        kind: 'IMAGE',
        content: 'rooms/r/7-a.png',
        fileName: 'a.png',
        mimeType: 'image/png',
        ord: 7, // seed drives ord (collision-free append), not existingCount
      }),
    );
    expect(touchRoom).toHaveBeenCalledWith('r', 2);
  });

  it('classifies an opaque upload as a FILE sticky', async () => {
    uploadMedia.mockResolvedValue('rooms/r/7-a.zip');
    create.mockResolvedValue({ data: {} });
    const file = new File(['x'], 'a.zip', { type: 'application/zip' });
    await createMediaSticky({ room: 'r', file, existingCount: 0, seed: 7 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ kind: 'FILE' }));
  });
});
