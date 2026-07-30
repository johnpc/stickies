/**
 * Reads the global "recent rooms" feed for the home page. Every Room row shares
 * the constant `listKey` partition, so a single GSI query sorted DESC by
 * lastEditedAt returns the most-recently-edited rooms across the whole app.
 */
import { dataClient, unwrap, type RoomRecord } from '../../lib/dataClient';
import { RECENTS_LIST_KEY } from './touchRoom';

/** Keep only non-empty rooms (a room whose stickies were all deleted lingers as
 * a `stickyCount: 0` recents row — clutter/dead-end on the home list). Pure. */
export function nonEmptyRooms(rows: readonly RoomRecord[]): RoomRecord[] {
  return rows.filter((r) => (r.stickyCount ?? 0) > 0);
}

/** The N most-recently-edited NON-EMPTY rooms (default 10), newest first. Over-
 * fetches so filtering out emptied rooms still fills the list, then slices. */
export async function listRecentRooms(limit = 10): Promise<RoomRecord[]> {
  const rows = unwrap(
    await dataClient.models.Room.listRoomByListKeyAndLastEditedAt(
      { listKey: RECENTS_LIST_KEY },
      { sortDirection: 'DESC', limit: limit * 3 },
    ),
  );
  return nonEmptyRooms(rows).slice(0, limit);
}
