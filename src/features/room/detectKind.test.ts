import { describe, expect, it } from 'vitest';
import { detectKind } from './detectKind';

describe('detectKind', () => {
  it('classifies a bare URL as LINK', () => {
    expect(detectKind('https://example.com')).toBe('LINK');
    expect(detectKind('example.com')).toBe('LINK');
  });

  it('classifies multi-word / whitespace content as TEXT', () => {
    expect(detectKind('buy milk')).toBe('TEXT');
    expect(detectKind('check example.com later')).toBe('TEXT');
  });

  it('classifies a non-URL token as TEXT', () => {
    expect(detectKind('hello')).toBe('TEXT');
  });

  it('classifies a javascript: URL as TEXT (not a safe link)', () => {
    expect(detectKind('javascript:alert(1)')).toBe('TEXT');
  });

  it('classifies empty content as TEXT', () => {
    expect(detectKind('   ')).toBe('TEXT');
  });
});
