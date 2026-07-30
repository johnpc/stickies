import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyCurrentUrl } from './copyCurrentUrl';

describe('copyCurrentUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the current URL and returns true on success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyCurrentUrl();
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('returns false when the clipboard write throws', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });
    expect(await copyCurrentUrl()).toBe(false);
  });
});
