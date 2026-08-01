import { describe, expect, it } from 'vitest';
import { parseOpenGraph } from './parseOpenGraph';

describe('parseOpenGraph', () => {
  it('extracts og:* fields regardless of attribute order', () => {
    const html = `
      <meta property="og:title" content="Hello &amp; World" />
      <meta content="A description" name="og:description" />
      <meta property="og:image" content="https://x/i.png" />
      <meta property="og:site_name" content="Example" />`;
    const out = parseOpenGraph(html);
    expect(out.title).toBe('Hello & World');
    expect(out.description).toBe('A description');
    expect(out.image).toBe('https://x/i.png');
    expect(out.siteName).toBe('Example');
  });

  it('falls back to twitter:* then <title>/description', () => {
    const html = `<title>Plain Title</title>
      <meta name="description" content="Meta desc" />
      <meta name="twitter:image" content="https://x/t.png" />`;
    const out = parseOpenGraph(html);
    expect(out.title).toBe('Plain Title');
    expect(out.description).toBe('Meta desc');
    expect(out.image).toBe('https://x/t.png');
  });

  it('returns nulls when nothing is present', () => {
    expect(parseOpenGraph('<html><body>hi</body></html>')).toEqual({
      title: null,
      description: null,
      image: null,
      siteName: null,
    });
  });

  it('length-caps attacker-influenced scraped fields (no megabyte title on every viewer)', () => {
    // og:*/meta content is set by whatever page a user links, cached, and sent to
    // EVERY viewer; the title has no CSS line-clamp, so an unbounded one would
    // balloon the card. Cap title/description/siteName at the source.
    const html =
      `<meta property="og:title" content="${'A'.repeat(5000)}">` +
      `<meta property="og:description" content="${'B'.repeat(5000)}">` +
      `<meta property="og:site_name" content="${'C'.repeat(5000)}">`;
    const out = parseOpenGraph(html);
    expect(out.title).toHaveLength(300);
    expect(out.description).toHaveLength(1000);
    expect(out.siteName).toHaveLength(100);
  });

  it('leaves normal-length fields untouched', () => {
    const out = parseOpenGraph(
      '<meta property="og:title" content="GitHub - johnpc"><meta property="og:description" content="A short bio.">',
    );
    expect(out.title).toBe('GitHub - johnpc');
    expect(out.description).toBe('A short bio.');
  });
});
