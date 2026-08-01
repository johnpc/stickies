export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

// Caps for scraped text fields. og:*/meta content is attacker-influenced (any
// page a user links can set them), and the value is cached and sent to EVERY
// viewer of the pad — an unbounded og:title (megabytes) would bloat the payload
// and, since the title has no CSS line-clamp, balloon the card and shove the grid
// around. Bound each field to a sane preview length at the source.
const MAX_TITLE = 300;
const MAX_DESCRIPTION = 1000;
const MAX_SITE_NAME = 100;

/** Length-cap a scraped field (null stays null). */
function cap(value: string | null, max: number): string | null {
  if (value == null) return null;
  return value.length > max ? value.slice(0, max) : value;
}

/** Read a `<meta>` value by matching `property`/`name` = one of `keys`, in either
 * attribute order (content-before-property or after). Returns the first hit. */
function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = re.exec(html);
      if (m?.[1]) return decode(m[1].trim());
    }
  }
  return null;
}

/** Minimal HTML-entity decode for the handful that show up in meta content. */
function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/**
 * Extract OpenGraph/meta preview fields from an HTML string. Prefers og:* tags,
 * falls back to twitter:* and the plain <title>/description. Pure + tested.
 */
export function parseOpenGraph(html: string): LinkPreviewData {
  const titleTag = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const title =
    meta(html, ['og:title', 'twitter:title']) ?? (titleTag ? decode(titleTag[1].trim()) : null);
  return {
    title: cap(title, MAX_TITLE),
    description: cap(
      meta(html, ['og:description', 'twitter:description', 'description']),
      MAX_DESCRIPTION,
    ),
    image: meta(html, ['og:image', 'twitter:image', 'twitter:image:src']),
    siteName: cap(meta(html, ['og:site_name', 'application-name']), MAX_SITE_NAME),
  };
}
