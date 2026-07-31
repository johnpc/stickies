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

  it('caps by CODE POINTS without bisecting a surrogate pair', () => {
    // Regression: a plain .slice(0,60) on a string of astral letters (e.g. a rare
    // CJK ideograph, one surrogate PAIR each) could cut a pair in half, leaving a
    // lone high surrogate. That made the slug non-idempotent AND made
    // encodeURIComponent throw, so the room URL couldn't be built or round-trip.
    const slug = normalizeRoomSlug('\u{20000}'.repeat(70));
    expect([...slug]).toHaveLength(60); // 60 code points, not units
    const last = slug.charCodeAt(slug.length - 1);
    expect(last < 0xd800 || last > 0xdbff).toBe(true); // not a lone high surrogate
    // The two properties the bug broke:
    expect(normalizeRoomSlug(slug)).toBe(slug); // idempotent
    expect(() => encodeURIComponent(slug)).not.toThrow(); // URL-safe
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
