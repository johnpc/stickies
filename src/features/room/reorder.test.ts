import { describe, expect, it } from 'vitest';
import { effectiveOrd, insertIndexFromPoint, computeReorder, type CardRect } from './reorder';
import type { StickyRecord } from '../../lib/dataClient';

const s = (over: Partial<StickyRecord>) => ({ id: 'x', ...over }) as StickyRecord;

// Three cards laid out left→right, each 100 wide, on one row.
const cards: CardRect[] = [
  { index: 0, left: 0, right: 100, top: 0, bottom: 100 },
  { index: 1, left: 100, right: 200, top: 0, bottom: 100 },
  { index: 2, left: 200, right: 300, top: 0, bottom: 100 },
];

describe('effectiveOrd', () => {
  it('uses a numeric ord when set', () => {
    expect(effectiveOrd(s({ ord: 3.5 }))).toBe(3.5);
  });

  it('falls back a null ord to createdAt-as-epoch-millis (same scale as app ords)', () => {
    const t = '2026-01-02T03:04:05.000Z';
    expect(effectiveOrd(s({ createdAt: t }))).toBe(Date.parse(t));
  });

  it('falls back to 0 when neither ord nor a parseable createdAt exists', () => {
    expect(effectiveOrd(s({}))).toBe(0);
  });
});

describe('insertIndexFromPoint', () => {
  it('returns the card index when the pointer is in its left half (insert before)', () => {
    expect(insertIndexFromPoint(cards, 120, 50)).toBe(1); // left half of card 1
  });

  it('returns index+1 when in the right half (insert after)', () => {
    expect(insertIndexFromPoint(cards, 180, 50)).toBe(2); // right half of card 1
  });

  it('clamps to the ends', () => {
    expect(insertIndexFromPoint(cards, -20, 50)).toBe(0);
    expect(insertIndexFromPoint(cards, 999, 50)).toBe(3);
  });

  it('returns 0 for an empty grid', () => {
    expect(insertIndexFromPoint([], 5, 5)).toBe(0);
  });
});

describe('computeReorder', () => {
  const list = [
    { id: 'a', ord: 0 },
    { id: 'b', ord: 1 },
    { id: 'c', ord: 2 },
  ] as StickyRecord[];

  it('moves forward: a → gap 2 lands between b and c (1.5)', () => {
    expect(computeReorder(list, 'a', 2)).toEqual({ id: 'a', ord: 1.5 });
  });

  it('moves backward: c → gap 0 lands before a (-1)', () => {
    expect(computeReorder(list, 'c', 0)).toEqual({ id: 'c', ord: -1 });
  });

  it('is a no-op when dropped in its own slot (before or after itself)', () => {
    expect(computeReorder(list, 'b', 1)).toBeNull();
    expect(computeReorder(list, 'b', 2)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(computeReorder(list, 'zzz', 0)).toBeNull();
  });

  // Regression: seed/demo rooms have null ords (ordered by createdAt). Dragging
  // a null-ord sticky to the end must write an ord that sorts it AFTER its
  // null-ord neighbours (whose effectiveOrd is their createdAt), not before —
  // previously the index fallback produced a tiny ord that snapped it to front.
  it('reorders a null-ord (seed) list so the moved sticky lands after its neighbours', () => {
    const seeded = [
      { id: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', createdAt: '2026-01-01T00:00:01.000Z' },
      { id: 'c', createdAt: '2026-01-01T00:00:02.000Z' },
    ] as StickyRecord[];
    const change = computeReorder(seeded, 'a', 3); // drag first → end
    expect(change).not.toBeNull();
    // The new ord must exceed c's effectiveOrd (its createdAt) so it sorts last.
    expect(change!.ord).toBeGreaterThan(Date.parse('2026-01-01T00:00:02.000Z'));
  });
});
