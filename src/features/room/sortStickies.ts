import type { StickyRecord } from '../../lib/dataClient';
import { effectiveOrd } from './reorder';

/** Stickies in pad order: by effective `ord` ascending, with createdAt as the
 * tiebreak. App-created stickies carry an `ord` (a Date.now() stamp), and
 * drag-reorder writes a fractional `ord`; a null `ord` (seed/legacy rows) falls
 * back to its createdAt-as-epoch-millis via `effectiveOrd` — the SAME numeric
 * scale computeReorder uses, so a dragged seed sticky lands where it's dropped
 * instead of snapping to the front. Pure — a stable sort over a copy. */
export function sortStickies(items: readonly StickyRecord[]): StickyRecord[] {
  return [...items].sort((a, b) => {
    const d = effectiveOrd(a) - effectiveOrd(b);
    if (d !== 0) return d;
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}
