import { describe, expect, it } from 'vitest';
import { byteLength, contentLengthError, MAX_CONTENT_BYTES } from './contentLimit';

describe('byteLength', () => {
  it('counts ASCII as one byte each', () => {
    expect(byteLength('hello')).toBe(5);
  });

  it('counts multi-byte characters by their real UTF-8 size', () => {
    expect(byteLength('é')).toBe(2); // U+00E9 → 2 bytes
    expect(byteLength('😀')).toBe(4); // astral → 4 bytes
  });
});

describe('contentLengthError', () => {
  it('allows text within the cap', () => {
    expect(contentLengthError('a short note')).toBeNull();
    expect(contentLengthError('a'.repeat(MAX_CONTENT_BYTES))).toBeNull();
  });

  it('rejects text over the cap with a friendly, actionable message', () => {
    const msg = contentLengthError('a'.repeat(MAX_CONTENT_BYTES + 1));
    expect(msg).toContain('too long');
    expect(msg).toContain('350 KB');
  });

  it('measures by BYTES, so a multi-byte blob just over the cap is rejected', () => {
    // Half as many astral chars (4 bytes each) still exceeds the byte cap.
    const chars = Math.ceil(MAX_CONTENT_BYTES / 4) + 1;
    expect(contentLengthError('😀'.repeat(chars))).not.toBeNull();
  });
});
