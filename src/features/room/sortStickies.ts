import type { StickyRecord } from '../../lib/dataClient';

/** Stickies in pad order: by manual `ord` when set, else created-order. A note
 * with no `ord` (never dragged) sorts by createdAt so the pad is stable; dragged
 * notes carry a fractional `ord` that wins. Pure — a stable sort over a copy. */
export function sortStickies(items: readonly StickyRecord[]): StickyRecord[] {
  return [...items].sort((a, b) => {
    const ao = typeof a.ord === 'number';
    const bo = typeof b.ord === 'number';
    if (ao && bo && a.ord !== b.ord) return (a.ord as number) - (b.ord as number);
    if (ao !== bo) return ao ? -1 : 1; // ordered notes ahead of un-ordered ones
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}
