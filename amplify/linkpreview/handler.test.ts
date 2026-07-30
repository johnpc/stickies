import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './handler';

// A minimal event/context/callback triple — the resolver only reads arguments.url.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const invoke = (url: string) => (handler as any)({ arguments: { url } }, {} as any, {} as any);

const EMPTY = { title: null, description: null, image: null, siteName: null };

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('linkPreview handler', () => {
  it('returns empty for an SSRF-blocked URL without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await invoke('http://169.254.169.254/latest/meta-data/')).toEqual(EMPTY);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses OG tags from a fetched HTML page and absolutizes the image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html; charset=utf-8' },
        text: () =>
          Promise.resolve(
            '<meta property="og:title" content="Hi"><meta property="og:image" content="/img.png">',
          ),
      }),
    );
    const out = await invoke('https://example.com/page');
    expect(out.title).toBe('Hi');
    expect(out.image).toBe('https://example.com/img.png');
  });

  it('returns empty when the response is not HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve('{}'),
      }),
    );
    expect(await invoke('https://example.com/api')).toEqual(EMPTY);
  });

  it('returns empty (fails soft) when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await invoke('https://example.com')).toEqual(EMPTY);
  });
});
