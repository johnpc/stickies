import { describe, expect, it } from 'vitest';
import { asStickySize, nextSize, SIZE_LABELS, STICKY_SIZES } from './stickySize';

describe('asStickySize', () => {
  it('accepts a known size', () => {
    expect(asStickySize('S')).toBe('S');
    expect(asStickySize('L')).toBe('L');
  });

  it('defaults unknown/nullish values to medium', () => {
    expect(asStickySize('XL')).toBe('M');
    expect(asStickySize(null)).toBe('M');
    expect(asStickySize(undefined)).toBe('M');
  });
});

describe('nextSize', () => {
  it('cycles S → M → L → S', () => {
    expect(nextSize('S')).toBe('M');
    expect(nextSize('M')).toBe('L');
    expect(nextSize('L')).toBe('S');
  });

  it('returns a valid size for every size', () => {
    for (const s of STICKY_SIZES) {
      expect(STICKY_SIZES).toContain(nextSize(s));
    }
  });
});

describe('SIZE_LABELS', () => {
  it('has a human label for every size', () => {
    for (const s of STICKY_SIZES) {
      expect(SIZE_LABELS[s]).toBeTruthy();
    }
  });
});
