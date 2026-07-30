/**
 * Upload a file to S3 and create the media sticky that points at it — the whole
 * "attach a file" server flow in one place. Classifies the file into a kind
 * (IMAGE/PDF/VIDEO/FILE), uploads under the room's prefix, then writes a Sticky
 * whose `content` is the S3 key plus the filename + mime for rendering.
 */
import { dataClient, unwrap, type StickyRecord } from '../../lib/dataClient';
import { touchRoom } from './touchRoom';
import { colorForIndex } from './stickyPalette';
import { mediaKey, uploadMedia } from './mediaApi';
import { mediaKind } from './mediaKind';

export async function createMediaSticky(input: {
  room: string;
  file: File;
  existingCount: number;
  seed: number;
}): Promise<StickyRecord> {
  const { room, file, existingCount, seed } = input;
  const key = await uploadMedia(mediaKey(room, file.name, seed), file);
  const created = unwrap(
    await dataClient.models.Sticky.create({
      room,
      kind: mediaKind(file.type, file.name),
      content: key,
      fileName: file.name,
      mimeType: file.type,
      color: colorForIndex(existingCount),
      ord: existingCount, // append; every sticky gets an ord so drag math is one scale
    }),
  );
  await touchRoom(room, existingCount + 1);
  return created as StickyRecord;
}
