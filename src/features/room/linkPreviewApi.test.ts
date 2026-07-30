import { beforeEach, describe, expect, it, vi } from 'vitest';

const { linkPreview } = vi.hoisted(() => ({ linkPreview: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { queries: { linkPreview } },
  unwrap: (r: { data: unknown }) => r.data,
}));

import { fetchLinkPreview, hasPreview } from './linkPreviewApi';

beforeEach(() => linkPreview.mockReset());

describe('fetchLinkPreview', () => {
  it('normalizes the resolver result to all-nullable fields', async () => {
    linkPreview.mockResolvedValue({ data: { title: 'T', image: null } });
    const out = await fetchLinkPreview('https://x');
    expect(out).toEqual({ title: 'T', description: null, image: null, siteName: null });
  });

  it('handles a null result', async () => {
    linkPreview.mockResolvedValue({ data: null });
    const out = await fetchLinkPreview('https://x');
    expect(out.title).toBeNull();
  });
});

describe('hasPreview', () => {
  it('is true with a title or image, false otherwise', () => {
    expect(hasPreview({ title: 'T', description: null, image: null, siteName: null })).toBe(true);
    expect(hasPreview({ title: null, description: null, image: 'i', siteName: null })).toBe(true);
    expect(hasPreview({ title: null, description: 'd', image: null, siteName: 's' })).toBe(false);
    expect(hasPreview(undefined)).toBe(false);
  });
});
