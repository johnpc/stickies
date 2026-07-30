/**
 * Upsert the recents-index row for a room. Called on every sticky write so the
 * home page can list the most-recently-edited rooms. The row id IS the slug, so
 * this is idempotent: first touch creates it, later touches bump lastEditedAt.
 *
 * `listKey` is a constant partition ("ALL") shared by every room, so the home
 * feed is one GSI query sorted by lastEditedAt. `count` is the room's authoritative
 * sticky count (the caller knows it post-write), so it stays accurate across
 * creates, edits, and deletes. Time is injected (default: now) so the ordering
 * logic is deterministic under test.
 */
import { dataClient, unwrap } from '../../lib/dataClient';

/** Shared partition key for the global "recent rooms" GSI. */
export const RECENTS_LIST_KEY = 'ALL';

export async function touchRoom(
  slug: string,
  count: number,
  now: string = new Date().toISOString(),
): Promise<void> {
  const existing = unwrap(await dataClient.models.Room.get({ id: slug }));
  if (existing) {
    unwrap(
      await dataClient.models.Room.update({ id: slug, lastEditedAt: now, stickyCount: count }),
    );
    return;
  }
  unwrap(
    await dataClient.models.Room.create({
      id: slug,
      slug,
      listKey: RECENTS_LIST_KEY,
      lastEditedAt: now,
      stickyCount: count,
    }),
  );
}
