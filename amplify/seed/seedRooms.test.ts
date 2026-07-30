import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, clearModel, stickyModel, roomModel } = vi.hoisted(() => {
  const stickyModel = { name: 'Sticky' };
  const roomModel = { name: 'Room' };
  return {
    create: vi.fn().mockResolvedValue({ data: {} }),
    clearModel: vi.fn().mockResolvedValue(undefined),
    stickyModel,
    roomModel,
  };
});

vi.mock('./seedClient', () => ({
  client: {
    models: {
      Sticky: { ...stickyModel, create },
      Room: { ...roomModel, create },
    },
  },
  clearModel,
}));

vi.mock('./fixtures/rooms', () => ({
  SEED_ROOMS: [
    { slug: 'a', stickies: [{ kind: 'TEXT', content: 'one' }] },
    {
      slug: 'b',
      stickies: [
        { kind: 'LINK', content: 'x.com' },
        { kind: 'TEXT', content: 'two' },
      ],
    },
  ],
}));

import { clearAll, seedRooms } from './seedRooms';

beforeEach(() => {
  create.mockClear();
  clearModel.mockClear();
});

describe('clearAll', () => {
  it('clears both models', async () => {
    await clearAll();
    expect(clearModel).toHaveBeenCalledTimes(2);
  });
});

describe('seedRooms', () => {
  it('creates every sticky plus one recents row per room', async () => {
    await seedRooms(1_000_000);
    // 3 stickies (1 + 2) + 2 room rows = 5 creates.
    expect(create).toHaveBeenCalledTimes(5);
  });

  it('stamps later rooms as more recently edited so they sort first', async () => {
    await seedRooms(1_000_000);
    const roomCreates = create.mock.calls.map((c) => c[0]).filter((arg) => 'listKey' in arg);
    expect(roomCreates).toHaveLength(2);
    expect(roomCreates[0].slug).toBe('a');
    expect(new Date(roomCreates[1].lastEditedAt).getTime()).toBeGreaterThan(
      new Date(roomCreates[0].lastEditedAt).getTime(),
    );
    expect(roomCreates[1].stickyCount).toBe(2);
  });
});
