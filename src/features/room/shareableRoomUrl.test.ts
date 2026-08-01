import { describe, expect, it } from 'vitest';
import { shareableRoomUrl, CANONICAL_ORIGIN } from './shareableRoomUrl';

describe('shareableRoomUrl', () => {
  it('rewrites a native capacitor:// href to the canonical web URL', () => {
    // The bug: inside the iOS app location.href is capacitor://localhost/<room>,
    // which a recipient cannot open. The shared link must be the real web URL.
    expect(shareableRoomUrl('capacitor://localhost/john')).toBe(`${CANONICAL_ORIGIN}/john`);
  });

  it('rewrites the Android http://localhost href to the canonical web URL', () => {
    expect(shareableRoomUrl('http://localhost/grocery-list')).toBe(
      `${CANONICAL_ORIGIN}/grocery-list`,
    );
  });

  it('keeps the path, query and hash while swapping only the origin', () => {
    expect(shareableRoomUrl('capacitor://localhost/team/notes?x=1#top')).toBe(
      `${CANONICAL_ORIGIN}/team/notes?x=1#top`,
    );
  });

  it('is a no-op origin-wise when already on the canonical web host (path stays percent-encoded)', () => {
    // URL.pathname is the canonical percent-encoded form — the QR encodes this;
    // the panel decodes it for display/copy separately via readableUrl.
    expect(shareableRoomUrl('https://stickies.jpc.io/café')).toBe(`${CANONICAL_ORIGIN}/caf%C3%A9`);
  });

  it('preserves a percent-encoded unicode path (canonical form scanners expect)', () => {
    expect(shareableRoomUrl('http://localhost/%E6%97%A5%E6%9C%AC%E8%AA%9E')).toBe(
      `${CANONICAL_ORIGIN}/%E6%97%A5%E6%9C%AC%E8%AA%9E`,
    );
  });

  it('falls back to the canonical root on an unparseable href', () => {
    expect(shareableRoomUrl('not a url')).toBe(CANONICAL_ORIGIN);
  });
});
