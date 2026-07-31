import { describe, expect, it } from 'vitest';
import { readableUrl } from './readableUrl';

describe('readableUrl', () => {
  it('leaves an ASCII URL unchanged', () => {
    expect(readableUrl('https://stickies.jpc.io/grocery-list')).toBe(
      'https://stickies.jpc.io/grocery-list',
    );
  });

  it('decodes a percent-encoded unicode path for display', () => {
    // window.location.href encodes a unicode room; show the readable form.
    const encoded = 'https://stickies.jpc.io/' + encodeURIComponent('日本語ノート');
    expect(readableUrl(encoded)).toBe('https://stickies.jpc.io/日本語ノート');
  });

  it('preserves query and hash', () => {
    expect(readableUrl('https://stickies.jpc.io/room?x=1#frag')).toBe(
      'https://stickies.jpc.io/room?x=1#frag',
    );
  });

  it('falls back to the raw input when decoding fails (malformed %-sequence)', () => {
    // A lone % is not a valid escape → decodeURIComponent throws → return as-is.
    const bad = 'https://stickies.jpc.io/broken%zz';
    expect(readableUrl(bad)).toBe(bad);
  });

  it('returns the input unchanged when it is not a parseable URL', () => {
    expect(readableUrl('not a url')).toBe('not a url');
  });
});
