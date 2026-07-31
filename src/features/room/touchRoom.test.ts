import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, create, update, listStickyByRoom } = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  listStickyByRoom: vi.fn(),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Room: { get, create, update }, Sticky: { listStickyByRoom } } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { RECENTS_LIST_KEY, touchRoom } from './touchRoom';

/** Make the re-read return a room with `n` stickies. */
const rowsOf = (n: number) => ({ data: Array.from({ length: n }, (_, i) => ({ id: `s${i}` })) });

beforeEach(() => {
  get.mockReset();
  create.mockReset();
  update.mockReset();
  listStickyByRoom.mockReset();
});

describe('touchRoom', () => {
  it('creates a new recents row with the RE-READ sticky count', async () => {
    listStickyByRoom.mockResolvedValue(rowsOf(1));
    get.mockResolvedValue({ data: null });
    create.mockResolvedValue({ data: {} });
    await touchRoom('grocery', 1, '2026-01-01T00:00:00Z');
    expect(create).toHaveBeenCalledWith({
      id: 'grocery',
      slug: 'grocery',
      listKey: RECENTS_LIST_KEY,
      lastEditedAt: '2026-01-01T00:00:00Z',
      stickyCount: 1,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('updates lastEditedAt + the RE-READ count on an existing row', async () => {
    listStickyByRoom.mockResolvedValue(rowsOf(4));
    get.mockResolvedValue({ data: { id: 'grocery', stickyCount: 3 } });
    update.mockResolvedValue({ data: {} });
    await touchRoom('grocery', 4, '2026-02-02T00:00:00Z');
    expect(update).toHaveBeenCalledWith({
      id: 'grocery',
      lastEditedAt: '2026-02-02T00:00:00Z',
      stickyCount: 4,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('writes the ACTUAL count, ignoring a stale fallback (the burst-delete drift fix)', async () => {
    // The caller froze a stale stickies.length of 2, but the pad is really empty
    // now (burst delete). touchRoom must store 0 — so nonEmptyRooms filters the
    // emptied room out of the feed instead of leaving it stuck at "2 stickies".
    listStickyByRoom.mockResolvedValue(rowsOf(0));
    get.mockResolvedValue({ data: { id: 'r', stickyCount: 3 } });
    update.mockResolvedValue({ data: {} });
    await touchRoom('r', 2, '2026-03-03T00:00:00Z');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ stickyCount: 0 }));
  });

  it('falls back to the passed count when the count re-read fails', async () => {
    listStickyByRoom.mockRejectedValue(new Error('read blipped'));
    get.mockResolvedValue({ data: { id: 'r' } });
    update.mockResolvedValue({ data: {} });
    await touchRoom('r', 5, '2026-04-04T00:00:00Z');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ stickyCount: 5 }));
  });

  it('never throws when the recents-index write fails (best-effort, not the sticky)', async () => {
    // Simulate the first-write race: get says "new", create conflicts.
    listStickyByRoom.mockResolvedValue(rowsOf(1));
    get.mockResolvedValue({ data: null });
    create.mockRejectedValue(new Error('The conditional request failed'));
    // Must resolve (swallow) — otherwise a SUCCESSFUL sticky write would be
    // reported to the user as failed.
    await expect(touchRoom('grocery', 1)).resolves.toBeUndefined();
  });

  it('swallows an update failure too', async () => {
    listStickyByRoom.mockResolvedValue(rowsOf(2));
    get.mockResolvedValue({ data: { id: 'grocery' } });
    update.mockRejectedValue(new Error('network'));
    await expect(touchRoom('grocery', 2)).resolves.toBeUndefined();
  });
});
