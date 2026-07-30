import type { StickyRecord } from '../../lib/dataClient';

/** Stickies in pad order: by numeric `ord` ascending, with createdAt as the
 * tiebreak. Every sticky created by the app carries an `ord` (append position),
 * and drag-reorder writes a fractional `ord`, so ordering is purely numeric.
 * Legacy/seed rows with a null `ord` sort last (Infinity) then by createdAt.
 * Pure — a stable sort over a copy. */
export function sortStickies(items: readonly StickyRecord[]): StickyRecord[] {
  const ord = (s: StickyRecord) => (typeof s.ord === 'number' ? s.ord : Infinity);
  return [...items].sort((a, b) => {
    if (ord(a) !== ord(b)) return ord(a) - ord(b);
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}
