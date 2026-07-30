import { describe, expect, it } from 'vitest';
import { asStickyColor, colorForIndex, STICKY_COLORS } from './stickyPalette';

describe('colorForIndex', () => {
  it('rotates through the palette', () => {
    expect(colorForIndex(0)).toBe('yellow');
    expect(colorForIndex(STICKY_COLORS.length)).toBe('yellow');
    expect(colorForIndex(1)).toBe(STICKY_COLORS[1]);
  });

  it('handles negative indices without going out of range', () => {
    expect(STICKY_COLORS).toContain(colorForIndex(-1));
  });
});

describe('asStickyColor', () => {
  it('accepts a known color', () => {
    expect(asStickyColor('blue')).toBe('blue');
  });

  it('defaults unknown/nullish values to yellow', () => {
    expect(asStickyColor('chartreuse')).toBe('yellow');
    expect(asStickyColor(null)).toBe('yellow');
    expect(asStickyColor(undefined)).toBe('yellow');
  });
});
