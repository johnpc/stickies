/** Re-create a just-deleted sticky with its original fields (the undo path).
 * Split from stickiesApi to keep that module within the line limit. Restores
 * content/kind/color/ord/media metadata so it reappears exactly where it was;
 * `count` is the room's post-restore sticky count. */
import { dataClient, unwrap, type StickyRecord } from '../../lib/dataClient';
import { touchRoom } from './touchRoom';

export async function restoreSticky(
  sticky: StickyRecord,
  room: string,
  count: number,
): Promise<void> {
  unwrap(
    await dataClient.models.Sticky.create({
      room: sticky.room,
      kind: sticky.kind,
      content: sticky.content,
      color: sticky.color,
      ord: sticky.ord,
      language: sticky.language,
      fileName: sticky.fileName,
      mimeType: sticky.mimeType,
    }),
  );
  await touchRoom(room, count);
}
