import { describe, expect, it } from 'vitest';
import { insertLineRect, type RelRect } from './insertLineRect';

// Two 100px cards on one row, 10px gap, relative to the grid origin.
const cards: RelRect[] = [
  { index: 0, left: 0, right: 100, top: 0, bottom: 100 },
  { index: 1, left: 110, right: 210, top: 0, bottom: 100 },
];

describe('insertLineRect', () => {
  it('sits in the gutter to the LEFT of the target card', () => {
    // Gap before card 1 → centered in the 10px gutter (110 - 5).
    expect(insertLineRect(cards, 1, 10)).toEqual({ left: 105, top: 0, height: 100 });
  });

  it('sits before the first card for insert index 0', () => {
    expect(insertLineRect(cards, 0, 10)).toEqual({ left: -5, top: 0, height: 100 });
  });

  it('sits in the trailing gutter after the last card at the end index', () => {
    expect(insertLineRect(cards, cards.length, 10)).toEqual({ left: 215, top: 0, height: 100 });
  });

  it('matches the target card height (so a Large tile gets a taller bar)', () => {
    const withLarge: RelRect[] = [
      { index: 0, left: 0, right: 210, top: 0, bottom: 210 }, // Large 2x2
      { index: 1, left: 220, right: 320, top: 0, bottom: 100 },
    ];
    expect(insertLineRect(withLarge, 0, 10)).toEqual({ left: -5, top: 0, height: 210 });
  });

  it('returns null for an empty grid', () => {
    expect(insertLineRect([], 0, 10)).toBeNull();
  });
});
