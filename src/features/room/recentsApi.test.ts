import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listRoomByListKeyAndLastEditedAt } = vi.hoisted(() => ({
  listRoomByListKeyAndLastEditedAt: vi.fn(),
}));

vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Room: { listRoomByListKeyAndLastEditedAt } } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { listRecentRooms } from './recentsApi';
import { RECENTS_LIST_KEY } from './touchRoom';

beforeEach(() => listRoomByListKeyAndLastEditedAt.mockReset());

describe('listRecentRooms', () => {
  it('queries the recents GSI newest-first with a limit', async () => {
    listRoomByListKeyAndLastEditedAt.mockResolvedValue({ data: [{ id: 'a' }] });
    const out = await listRecentRooms(10);
    expect(listRoomByListKeyAndLastEditedAt).toHaveBeenCalledWith(
      { listKey: RECENTS_LIST_KEY },
      { sortDirection: 'DESC', limit: 10 },
    );
    expect(out).toEqual([{ id: 'a' }]);
  });
});
