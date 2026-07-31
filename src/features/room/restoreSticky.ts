/** Re-create a just-deleted sticky with its original fields (the undo path).
 * Split from stickiesApi to keep that module within the line limit. Restores
 * content/kind/color/SIZE/ord/media metadata so it reappears EXACTLY as it was —
 * every persisted field must be copied here or undo silently loses it (size was
 * dropped, so undoing a Large/Small note brought it back Medium). `count` is the
 * room's post-restore sticky count. */
import { dataClient, unwrapWrite, type StickyRecord } from '../../lib/dataClient';
import { withTimeout } from '../../lib/withTimeout';
import { touchRoom } from './touchRoom';

export async function restoreSticky(
  sticky: StickyRecord,
  room: string,
  count: number,
): Promise<void> {
  unwrapWrite(
    await withTimeout(
      dataClient.models.Sticky.create({
        room: sticky.room,
        kind: sticky.kind,
        content: sticky.content,
        color: sticky.color,
        size: sticky.size,
        ord: sticky.ord,
        language: sticky.language,
        fileName: sticky.fileName,
        mimeType: sticky.mimeType,
      }),
    ),
  );
  await touchRoom(room, count);
}
