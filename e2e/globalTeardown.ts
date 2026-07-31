/**
 * After the acceptance suite, delete the rooms it created. The e2e tests run
 * against the SAME shared sandbox backend prod serves from, so their rooms would
 * otherwise accumulate and pollute the live recents feed. Every test room's slug
 * is TEST_ROOM_PREFIX-prefixed (e2e/steps/fixtures.ts); we delete those rooms'
 * stickies AND their recents (Room) rows. Best-effort — a cleanup hiccup must
 * never fail the test run.
 */
import { client } from '../amplify/seed/seedClient';
import { TEST_ROOM_PREFIX } from './steps/fixtures';

const isTestRoom = (slug: string | null | undefined) => !!slug?.startsWith(TEST_ROOM_PREFIX);

async function deleteAll<T extends { id: string }>(
  list: (opts: { limit: number; nextToken?: string }) => Promise<{
    data: (T | null)[];
    nextToken?: string | null;
  }>,
  del: (arg: { id: string }) => Promise<unknown>,
  keep: (row: T) => boolean,
): Promise<number> {
  let nextToken: string | undefined;
  let deleted = 0;
  do {
    const page = await list({ limit: 200, nextToken });
    for (const row of page.data) {
      if (row && keep(row)) {
        await del({ id: row.id }).catch(() => {});
        deleted += 1;
      }
    }
    nextToken = page.nextToken ?? undefined;
  } while (nextToken);
  return deleted;
}

export default async function globalTeardown(): Promise<void> {
  try {
    const stickies = await deleteAll(
      (o) => client.models.Sticky.list(o),
      (a) => client.models.Sticky.delete(a),
      (r) => isTestRoom((r as { room?: string }).room),
    );
    const rooms = await deleteAll(
      (o) => client.models.Room.list(o),
      (a) => client.models.Room.delete(a),
      (r) => isTestRoom((r as { slug?: string }).slug),
    );
    console.log(`[e2e teardown] removed ${rooms} test room(s) + ${stickies} sticky(ies).`);
  } catch (err) {
    console.warn('[e2e teardown] cleanup skipped:', (err as Error)?.message);
  }
}
