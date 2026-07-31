import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, create, update } = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Room: { get, create, update } } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { RECENTS_LIST_KEY, touchRoom } from './touchRoom';

beforeEach(() => {
  get.mockReset();
  create.mockReset();
  update.mockReset();
});

describe('touchRoom', () => {
  it('creates a new recents row when the room has never been touched', async () => {
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

  it('updates lastEditedAt + count on an existing row', async () => {
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

  it('never throws when the recents-index write fails (best-effort, not the sticky)', async () => {
    // Simulate the first-write race: get says "new", create conflicts.
    get.mockResolvedValue({ data: null });
    create.mockRejectedValue(new Error('The conditional request failed'));
    // Must resolve (swallow) — otherwise a SUCCESSFUL sticky write would be
    // reported to the user as failed.
    await expect(touchRoom('grocery', 1)).resolves.toBeUndefined();
  });

  it('swallows an update failure too', async () => {
    get.mockResolvedValue({ data: { id: 'grocery' } });
    update.mockRejectedValue(new Error('network'));
    await expect(touchRoom('grocery', 2)).resolves.toBeUndefined();
  });
});
