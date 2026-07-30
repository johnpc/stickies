/**
 * Reads the global "recent rooms" feed for the home page. Every Room row shares
 * the constant `listKey` partition, so a single GSI query sorted DESC by
 * lastEditedAt returns the most-recently-edited rooms across the whole app.
 */
import { dataClient, unwrap, type RoomRecord } from '../../lib/dataClient';
import { RECENTS_LIST_KEY } from './touchRoom';

/** The N most-recently-edited rooms (default 10), newest first. */
export async function listRecentRooms(limit = 10): Promise<RoomRecord[]> {
  const rows = unwrap(
    await dataClient.models.Room.listRoomByListKeyAndLastEditedAt(
      { listKey: RECENTS_LIST_KEY },
      { sortDirection: 'DESC', limit },
    ),
  );
  return rows;
}
