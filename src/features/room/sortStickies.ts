import type { StickyRecord } from '../../lib/dataClient';
import { effectiveOrd } from './reorder';

/** Stickies in pad order: by effective `ord` ascending, with createdAt as the
 * tiebreak. App-created stickies carry an `ord` (a Date.now() stamp), and
 * drag-reorder writes a fractional `ord`; a null `ord` (seed/legacy rows) falls
 * back to its createdAt-as-epoch-millis via `effectiveOrd` — the SAME numeric
 * scale computeReorder uses, so a dragged seed sticky lands where it's dropped
 * instead of snapping to the front. Pure — a stable sort over a copy.
 *
 * The `id` tiebreak makes this a TOTAL order: two notes can collide on BOTH ord
 * and createdAt (an app-written `ord` IS the createdAt-ms, so two adds in the
 * same millisecond tie on both), and relying on JS's stable-sort would then let
 * two viewers show them in opposite order — the fetch and each live snapshot can
 * deliver a tied pair in different sequence per device. Ordering by the immutable
 * `id` last pins one global order everyone agrees on. */
export function sortStickies(items: readonly StickyRecord[]): StickyRecord[] {
  return [...items].sort((a, b) => {
    const d = effectiveOrd(a) - effectiveOrd(b);
    if (d !== 0) return d;
    const c = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
}
