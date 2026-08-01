import { describe, expect, it, vi } from 'vitest';
import { canShare, shareUrl, type ShareNavigator } from './shareUrl';

describe('canShare', () => {
  it('is true only when navigator.share is a function', () => {
    expect(canShare({ share: vi.fn() })).toBe(true);
    expect(canShare({})).toBe(false);
  });
});

describe('shareUrl', () => {
  it('invokes the native sheet with the url and reports shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav: ShareNavigator = { share };
    expect(await shareUrl('https://stickies.jpc.io/x', 'Stickies', nav)).toBe('shared');
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://stickies.jpc.io/x' }),
    );
  });

  it('reports cancelled (not failed) when the user dismisses the sheet', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(abort) };
    expect(await shareUrl('https://x', 'Stickies', nav)).toBe('cancelled');
  });

  it('reports failed on any other error', async () => {
    const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(new Error('boom')) };
    expect(await shareUrl('https://x', 'Stickies', nav)).toBe('failed');
  });

  it('reports unavailable when the API is absent (never throws)', async () => {
    expect(await shareUrl('https://x', 'Stickies', {})).toBe('unavailable');
  });
});
