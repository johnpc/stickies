import { describe, expect, it } from 'vitest';
import { orderKey, insertIndexFromPoint, computeReorder, type CardRect } from './reorder';
import type { StickyRecord } from '../../lib/dataClient';

const s = (over: Partial<StickyRecord>) => ({ id: 'x', ...over }) as StickyRecord;

// Three cards laid out left→right, each 100 wide, on one row.
const cards: CardRect[] = [
  { index: 0, left: 0, right: 100, top: 0, bottom: 100 },
  { index: 1, left: 100, right: 200, top: 0, bottom: 100 },
  { index: 2, left: 200, right: 300, top: 0, bottom: 100 },
];

describe('orderKey', () => {
  it('uses ord when set, else the index fallback', () => {
    expect(orderKey(s({ ord: 3.5 }), 0)).toBe(3.5);
    expect(orderKey(s({}), 7)).toBe(7);
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
});
