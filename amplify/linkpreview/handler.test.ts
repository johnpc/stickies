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
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'text/html; charset=utf-8' : null) },
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

  it('drops a non-http(s) og:image (data:/javascript:) but keeps the rest of the card', async () => {
    // og:image is attacker-controlled and lands in the client's <img src> on a
    // world-writable pad — a data:/javascript:/file: scheme must never pass through.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'text/html' : null) },
        text: () =>
          Promise.resolve(
            '<meta property="og:title" content="Hi">' +
              '<meta property="og:image" content="javascript:alert(1)">',
          ),
      }),
    );
    const out = await invoke('https://example.com/page');
    expect(out.title).toBe('Hi'); // card still renders
    expect(out.image).toBeNull(); // dangerous image scheme stripped
  });

  it('keeps an absolute http(s) og:image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'text/html' : null) },
        text: () =>
          Promise.resolve('<meta property="og:image" content="https://cdn.example/pic.png">'),
      }),
    );
    const out = await invoke('https://example.com/page');
    expect(out.image).toBe('https://cdn.example/pic.png');
  });

  it('returns empty when the response is not HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'application/json' : null) },
        text: () => Promise.resolve('{}'),
      }),
    );
    expect(await invoke('https://example.com/api')).toEqual(EMPTY);
  });

  it('returns empty (fails soft) when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await invoke('https://example.com')).toEqual(EMPTY);
  });

  it('follows a redirect to a PUBLIC host and previews the final page', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({
        status: 302,
        headers: { get: (h: string) => (h === 'location' ? 'https://dest.example/final' : null) },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'text/html' : null) },
        text: () => Promise.resolve('<meta property="og:title" content="Final">'),
      });
    vi.stubGlobal('fetch', fetchSpy);
    const out = await invoke('https://start.example/go');
    expect(out.title).toBe('Final');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('refuses a redirect to an INTERNAL host (SSRF-via-redirect) and stops fetching', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce({
      status: 302,
      headers: { get: (h: string) => (h === 'location' ? 'http://169.254.169.254/' : null) },
    });
    vi.stubGlobal('fetch', fetchSpy);
    expect(await invoke('https://evil.example/redirect')).toEqual(EMPTY);
    // Only the first (public) hop was fetched; the internal target was never hit.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
