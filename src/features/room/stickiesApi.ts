/**
 * Raw Amplify Data calls for stickies in a room — the ONLY place server reads/
 * writes for the Sticky model live (hooks + components consume these, never the
 * client directly). Each write also touches the room's recents row, passing the
 * post-write sticky count so the recents index stays accurate.
 */
import { dataClient, unwrap, type StickyRecord } from '../../lib/dataClient';
import { touchRoom } from './touchRoom';
import { colorForIndex } from './stickyPalette';
import { removeMedia } from './mediaApi';

export type StickyKind = 'TEXT' | 'LINK' | 'CODE' | 'IMAGE' | 'PDF' | 'VIDEO' | 'DOC' | 'FILE';

/** All stickies in a room, oldest-created first (the pad's natural order). */
export async function listStickiesByRoom(room: string): Promise<StickyRecord[]> {
  const rows = unwrap(await dataClient.models.Sticky.listStickyByRoom({ room }));
  return [...rows].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

/** Add a sticky to a room and bump the room's recents row. `existingCount` is
 * how many stickies the room had before this add (drives color + new count). */
export async function createSticky(input: {
  room: string;
  kind: StickyKind;
  content: string;
  language?: string;
  existingCount: number;
}): Promise<StickyRecord> {
  const created = unwrap(
    await dataClient.models.Sticky.create({
      room: input.room,
      kind: input.kind,
      content: input.content,
      language: input.language,
      color: colorForIndex(input.existingCount),
    }),
  );
  await touchRoom(input.room, input.existingCount + 1);
  return created as StickyRecord;
}

/** Edit a sticky's body (and re-touch its room; count unchanged). */
export async function updateStickyContent(
  id: string,
  room: string,
  content: string,
  count: number,
): Promise<StickyRecord> {
  const updated = unwrap(await dataClient.models.Sticky.update({ id, content }));
  await touchRoom(room, count);
  return updated as StickyRecord;
}

/** Remove a sticky (and re-touch its room with the reduced count). For media/doc
 * kinds `mediaPath` is the S3 key to clean up so deleting the sticky doesn't
 * orphan its object; S3 removal is best-effort (a failure never blocks the row
 * delete). */
export async function deleteSticky(
  id: string,
  room: string,
  remainingCount: number,
  mediaPath?: string | null,
): Promise<void> {
  unwrap(await dataClient.models.Sticky.delete({ id }));
  if (mediaPath) await removeMedia(mediaPath).catch(() => {});
  await touchRoom(room, remainingCount);
}
