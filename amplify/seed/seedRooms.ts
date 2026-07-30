/** Seeds the demo rooms: for each, create its stickies (colors rotate through
 * the palette in order) and one Room recents row stamped so the home feed shows
 * them newest-first in list order. Guest (identityPool) writes — no sign-in. */
import { client, clearModel } from './seedClient';
import { SEED_ROOMS } from './fixtures/rooms';

const RECENTS_LIST_KEY = 'ALL';
const COLORS = ['yellow', 'pink', 'blue', 'green', 'purple'];

/** Wipe both models so a re-seed converges to a known state. */
export async function clearAll(): Promise<void> {
  await clearModel(client.models.Sticky);
  await clearModel(client.models.Room);
}

/** Insert every seed room + its stickies. `baseTime` anchors the recents order
 * (injected so the stamping is deterministic under test). */
export async function seedRooms(baseTime = Date.now()): Promise<void> {
  for (let i = 0; i < SEED_ROOMS.length; i++) {
    const room = SEED_ROOMS[i];
    for (let s = 0; s < room.stickies.length; s++) {
      const sticky = room.stickies[s];
      await client.models.Sticky.create({
        room: room.slug,
        kind: sticky.kind,
        content: sticky.content,
        color: COLORS[s % COLORS.length],
      });
    }
    // Later rooms get a more-recent stamp so they surface first in recents.
    const lastEditedAt = new Date(baseTime + i * 1000).toISOString();
    await client.models.Room.create({
      id: room.slug,
      slug: room.slug,
      listKey: RECENTS_LIST_KEY,
      lastEditedAt,
      stickyCount: room.stickies.length,
    });
  }
}
