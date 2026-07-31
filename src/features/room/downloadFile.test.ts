import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFile } from './downloadFile';

describe('downloadFile', () => {
  beforeEach(() => {
    // jsdom lacks these — stub the blob-URL plumbing.
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches the bytes and saves them via a same-origin blob link with the filename', async () => {
    const blob = new Blob(['data']);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) }),
    );
    const clicks: HTMLAnchorElement[] = [];
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this);
    });

    const ok = await downloadFile('https://s3.example.com/x.png?sig=1', 'holiday.png');

    expect(ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://s3.example.com/x.png?sig=1');
    expect(clicks).toHaveLength(1);
    // Saved as a same-origin blob URL under the ORIGINAL filename (download honored).
    expect(clicks[0].href).toBe('blob:mock');
    expect(clicks[0].download).toBe('holiday.png');
    clickSpy.mockRestore();
  });

  it('falls back to opening the URL in a new tab when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const ok = await downloadFile('https://s3.example.com/x.png', 'x.png');

    expect(ok).toBe(false);
    expect(openSpy).toHaveBeenCalledWith(
      'https://s3.example.com/x.png',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
