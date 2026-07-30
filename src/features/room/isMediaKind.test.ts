import { describe, expect, it } from 'vitest';
import { isMediaKind } from './isMediaKind';

describe('isMediaKind', () => {
  it('is true for upload-backed kinds', () => {
    for (const k of ['IMAGE', 'PDF', 'VIDEO', 'FILE'] as const) {
      expect(isMediaKind(k)).toBe(true);
    }
  });

  it('is false for text-ish kinds and null', () => {
    expect(isMediaKind('TEXT')).toBe(false);
    expect(isMediaKind('LINK')).toBe(false);
    expect(isMediaKind('CODE')).toBe(false);
    expect(isMediaKind(null)).toBe(false);
  });
});
