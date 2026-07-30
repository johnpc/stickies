import { describe, expect, it } from 'vitest';
import { orderKey, ordForDropBefore, sequentialOrds } from './reorder';
import type { StickyRecord } from '../../lib/dataClient';

const s = (over: Partial<StickyRecord>) => ({ id: 'x', ...over }) as StickyRecord;

describe('orderKey', () => {
  it('uses ord when set, else the index fallback', () => {
    expect(orderKey(s({ ord: 3.5 }), 0)).toBe(3.5);
    expect(orderKey(s({}), 7)).toBe(7);
  });
});

describe('ordForDropBefore', () => {
  it('places between two neighbors (fractional, no reindex)', () => {
    expect(ordForDropBefore([0, 1, 2], 1)).toBe(0.5);
    expect(ordForDropBefore([0, 2, 4], 2)).toBe(3);
  });

  it('places before the first (front of the pad)', () => {
    expect(ordForDropBefore([5, 6], 0)).toBe(4);
  });

  it('places after the last (end of the pad)', () => {
    expect(ordForDropBefore([5, 6], 2)).toBe(7);
  });

  it('handles an empty list', () => {
    expect(ordForDropBefore([], 0)).toBe(-1);
  });
});

describe('sequentialOrds', () => {
  it('produces 0..n-1', () => {
    expect(sequentialOrds(3)).toEqual([0, 1, 2]);
  });
});
