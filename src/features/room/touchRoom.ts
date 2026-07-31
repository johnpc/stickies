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
  // BEST-EFFORT: the Room row is only the home-page recents index, not the
  // sticky itself. Callers run this AFTER the real Sticky write, so a failure
  // here (e.g. two viewers' first-write to a new room racing on create → a
  // DynamoDB conditional-check error) must NOT reject and make a SUCCESSFUL
  // sticky write surface a false "write failed" toast. Swallow + move on; the
  // next write reconciles the count.
  try {
    await upsertRoom(slug, count, now);
  } catch {
    /* recents index is non-critical — never fail the sticky write over it */
  }
}

async function upsertRoom(slug: string, count: number, now: string): Promise<void> {
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
