import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomRecord } from '../../lib/dataClient';

const { listRoomByListKeyAndLastEditedAt } = vi.hoisted(() => ({
  listRoomByListKeyAndLastEditedAt: vi.fn(),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Room: { listRoomByListKeyAndLastEditedAt } } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { listRecentRooms, nonEmptyRooms } from './recentsApi';
import { RECENTS_LIST_KEY } from './touchRoom';

const room = (id: string, stickyCount?: number) => ({ id, stickyCount }) as RoomRecord;

beforeEach(() => listRoomByListKeyAndLastEditedAt.mockReset());

describe('nonEmptyRooms', () => {
  it('drops rooms with 0 / missing stickyCount, keeps the rest', () => {
    const out = nonEmptyRooms([room('a', 2), room('b', 0), room('c'), room('d', 1)]);
    expect(out.map((r) => r.id)).toEqual(['a', 'd']);
  });
});

describe('listRecentRooms', () => {
  it('queries the recents GSI newest-first, over-fetching to backfill filtered rooms', async () => {
    listRoomByListKeyAndLastEditedAt.mockResolvedValue({ data: [room('a', 1)] });
    await listRecentRooms(10);
    expect(listRoomByListKeyAndLastEditedAt).toHaveBeenCalledWith(
      { listKey: RECENTS_LIST_KEY },
      { sortDirection: 'DESC', limit: 30 },
    );
  });

  it('filters out empty rooms and caps the result at the display limit', async () => {
    const data = [room('a', 3), room('empty', 0), room('b', 1), room('c', 5)];
    listRoomByListKeyAndLastEditedAt.mockResolvedValue({ data });
    const out = await listRecentRooms(2);
    expect(out.map((r) => r.id)).toEqual(['a', 'b']); // 'empty' dropped, capped to 2
  });
});
