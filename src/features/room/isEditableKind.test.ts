import { describe, expect, it } from 'vitest';
import { isEditableKind } from './isEditableKind';

describe('isEditableKind', () => {
  it('is true for user-authored text kinds', () => {
    for (const k of ['TEXT', 'LINK', 'CODE'] as const) expect(isEditableKind(k)).toBe(true);
  });

  it('is false for media kinds (content is an S3 key, not editable text)', () => {
    for (const k of ['IMAGE', 'PDF', 'VIDEO', 'DOC', 'FILE'] as const) {
      expect(isEditableKind(k)).toBe(false);
    }
  });

  it('defaults a null kind to editable (renders as text)', () => {
    expect(isEditableKind(null)).toBe(true);
  });
});
