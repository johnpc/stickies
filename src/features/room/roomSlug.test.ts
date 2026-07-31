import { describe, expect, it } from 'vitest';
import { normalizeRoomSlug, prettifyRoomSlug } from './roomSlug';

describe('normalizeRoomSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(normalizeRoomSlug('Grocery List')).toBe('grocery-list');
  });

  it('treats spaces, underscores, and hyphens equivalently', () => {
    expect(normalizeRoomSlug('grocery_list')).toBe('grocery-list');
    expect(normalizeRoomSlug('grocery   list')).toBe('grocery-list');
  });

  it('strips punctuation and collapses hyphens', () => {
    expect(normalizeRoomSlug('  Hello, World!!  ')).toBe('hello-world');
    expect(normalizeRoomSlug('a---b')).toBe('a-b');
  });

  it('trims leading/trailing hyphens', () => {
    expect(normalizeRoomSlug('-team-')).toBe('team');
  });

  it('returns empty string for input with no usable characters', () => {
    expect(normalizeRoomSlug('!!!')).toBe('');
    expect(normalizeRoomSlug('   ')).toBe('');
    expect(normalizeRoomSlug('🎉🎉')).toBe(''); // emoji-only → nothing usable
  });

  it('folds accented Latin to ASCII (Café → cafe)', () => {
    expect(normalizeRoomSlug('Café')).toBe('cafe');
    expect(normalizeRoomSlug('Ünïcode Straße')).toBe('unicode-straße');
  });

  it('keeps non-Latin letters/digits instead of erasing them', () => {
    expect(normalizeRoomSlug('日本語')).toBe('日本語');
    expect(normalizeRoomSlug('Café 日本語 🎉')).toBe('cafe-日本語');
  });

  it('caps length and never ends on a dangling hyphen', () => {
    const slug = normalizeRoomSlug('a'.repeat(80));
    expect(slug.length).toBe(60);
    const capped = normalizeRoomSlug(`${'a'.repeat(59)} bcd`);
    expect(capped.endsWith('-')).toBe(false);
  });
});

describe('prettifyRoomSlug', () => {
  it('title-cases hyphen-separated words', () => {
    expect(prettifyRoomSlug('grocery-list')).toBe('Grocery List');
  });

  it('ignores empty segments', () => {
    expect(prettifyRoomSlug('a--b')).toBe('A B');
    expect(prettifyRoomSlug('')).toBe('');
  });
});
