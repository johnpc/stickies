import type { StickyRecord } from '../../lib/dataClient';

/**
 * A sticky's effective numeric order. App-written ords are `Date.now()` epoch
 * millis (see createSticky), so a null ord (seed rows, legacy data) falls back to
 * its createdAt as epoch millis — the SAME scale — which keeps un-ordered stickies
 * in created order AND lets a reordered one slot among them. Using the index or
 * Infinity instead put null and numeric ords on different scales, so a dragged
 * seed sticky (now finite) jumped to the front past its still-null neighbours.
 * sortStickies + computeReorder MUST share this so the drop lands where shown.
 */
export function effectiveOrd(s: StickyRecord): number {
  if (typeof s.ord === 'number') return s.ord;
  const t = s.createdAt ? Date.parse(s.createdAt) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/** Rectangle of a rendered sticky card (subset of DOMRect) + its list index. */
export interface CardRect {
  index: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Distance from a point to a rectangle (0 when the point is inside it). */
function distToRect(c: CardRect, x: number, y: number): number {
  const dx = Math.max(c.left - x, 0, x - c.right);
  const dy = Math.max(c.top - y, 0, y - c.bottom);
  return Math.hypot(dx, dy);
}

/**
 * Which GAP the pointer is over, as an insert index in 0..cards.length ("place
 * before the card at this index", or at the end when === length). Picks the card
 * nearest the pointer BY ITS RECTANGLE (0 when the pointer is inside it), then
 * before/after by that card's horizontal midpoint. Distance-to-rect (not
 * distance-to-center) is what makes this correct for VARIABLE-size tiles: a Large
 * 2×2 tile's center is far from a point in its lower corner, so center-distance
 * would wrongly pick a small neighbour in the next row and drop there; rect-
 * distance keeps the pointer on the tile it's actually over. Pure + tested.
 */
export function insertIndexFromPoint(cards: CardRect[], x: number, y: number): number {
  if (cards.length === 0) return 0;
  let best = cards[0];
  let bestDist = Infinity;
  for (const c of cards) {
    const dist = distToRect(c, x, y);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return x < (best.left + best.right) / 2 ? best.index : best.index + 1;
}

/**
 * The `{id, ord}` to persist when the dragged sticky is dropped at `insertIndex`
 * (a gap in the current visual order), or null if it wouldn't move. Uses
 * fractional ords so one move writes one row (no reindex). Pure + tested.
 */
export function computeReorder(
  stickies: StickyRecord[],
  fromId: string,
  insertIndex: number,
): { id: string; ord: number } | null {
  const fromIndex = stickies.findIndex((s) => s.id === fromId);
  if (fromIndex < 0) return null;
  // Dropping into its own slot (right before or right after itself) is a no-op.
  if (insertIndex === fromIndex || insertIndex === fromIndex + 1) return null;

  const others = stickies.filter((s) => s.id !== fromId);
  const target = insertIndex > fromIndex ? insertIndex - 1 : insertIndex;
  const ords = others.map(effectiveOrd);
  const STEP = 1;
  let ord: number;
  if (target <= 0) ord = (ords[0] ?? 0) - STEP;
  else if (target >= ords.length) ord = (ords[ords.length - 1] ?? 0) + STEP;
  else ord = (ords[target - 1] + ords[target]) / 2;
  return { id: fromId, ord };
}
