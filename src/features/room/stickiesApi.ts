/**
 * Raw Amplify Data calls for stickies in a room — the ONLY place server reads/
 * writes for the Sticky model live (hooks + components consume these, never the
 * client directly). Each write also touches the room's recents row, passing the
 * post-write sticky count so the recents index stays accurate.
 */
import { dataClient, unwrap, unwrapWrite, type StickyRecord } from '../../lib/dataClient';
import { withTimeout } from '../../lib/withTimeout';
import { touchRoom } from './touchRoom';
import { colorForIndex } from './stickyPalette';
import { sortStickies } from './sortStickies';

export type StickyKind = 'TEXT' | 'LINK' | 'CODE' | 'IMAGE' | 'PDF' | 'VIDEO' | 'DOC' | 'FILE';

/** All stickies in a room, in pad order (by `ord`, then createdAt) — the SAME
 * order the live subscription uses, so the initial fetch and live updates agree
 * (a reload must not revert a drag-reorder). */
export async function listStickiesByRoom(room: string): Promise<StickyRecord[]> {
  const rows = unwrap(await dataClient.models.Sticky.listStickyByRoom({ room }));
  return sortStickies(rows);
}

/** Add a sticky to a room and bump the room's recents row. `seq` is a MONOTONIC
 * stamp (a wall-clock time from the caller) used for both `ord` (append order)
 * and the rotating color — using it instead of a render-time count means rapid
 * concurrent adds can't collide on the same ord/color. `existingCount` only
 * feeds the recents row's display count. */
export async function createSticky(input: {
  room: string;
  kind: StickyKind;
  content: string;
  language?: string;
  seq: number;
  existingCount: number;
}): Promise<StickyRecord> {
  const created = unwrapWrite(
    await withTimeout(
      dataClient.models.Sticky.create({
        room: input.room,
        kind: input.kind,
        content: input.content,
        language: input.language,
        color: colorForIndex(input.seq),
        ord: input.seq, // monotonic append; distinct per add so order is stable
      }),
    ),
  );
  await touchRoom(input.room, input.existingCount + 1);
  return created as StickyRecord;
}

/** Edit a sticky's body, RECLASSIFYING its kind (a URL becomes a LINK, a fenced
 * block becomes CODE, etc.) — otherwise an edited note would keep its old kind
 * (e.g. text edited into a URL would never become a tappable link). `language`
 * is written too (set for CODE, cleared otherwise). Re-touches the room. */
export async function updateStickyContent(
  id: string,
  room: string,
  input: { kind: StickyKind; content: string; language?: string },
  count: number,
): Promise<StickyRecord> {
  const updated = unwrapWrite(
    await withTimeout(
      dataClient.models.Sticky.update({
        id,
        kind: input.kind,
        content: input.content,
        language: input.language ?? null,
      }),
    ),
  );
  await touchRoom(room, count);
  return updated as StickyRecord;
}

/** Remove a sticky (and re-touch its room with the reduced count). Deletes ONLY
 * the row, not any uploaded S3 object — so a delete stays undoable (see
 * restoreSticky) and a media sticky can be restored pointing at the retained
 * object. (Reaping truly-orphaned objects is a separate background concern.) */
export async function deleteSticky(
  id: string,
  room: string,
  remainingCount: number,
): Promise<void> {
  unwrap(await dataClient.models.Sticky.delete({ id }));
  await touchRoom(room, remainingCount);
}
