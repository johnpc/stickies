/** Arrange writes for a sticky (recolor + reorder) — split from stickiesApi to
 * keep each module focused + within the line limit. Both are metadata edits that
 * re-touch the room (count unchanged). */
import { dataClient, unwrapWrite, type StickyRecord } from '../../lib/dataClient';
import { withTimeout } from '../../lib/withTimeout';
import { touchRoom } from './touchRoom';

/** Recolor a sticky. */
export async function setStickyColor(
  id: string,
  room: string,
  color: string,
  count: number,
): Promise<StickyRecord> {
  const updated = unwrapWrite(await withTimeout(dataClient.models.Sticky.update({ id, color })));
  await touchRoom(room, count);
  return updated as StickyRecord;
}

/** Persist a sticky's manual order position (set on drag-drop). */
export async function setStickyOrder(
  id: string,
  room: string,
  ord: number,
  count: number,
): Promise<StickyRecord> {
  const updated = unwrapWrite(await withTimeout(dataClient.models.Sticky.update({ id, ord })));
  await touchRoom(room, count);
  return updated as StickyRecord;
}
