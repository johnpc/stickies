export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
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
  return {
    title:
      meta(html, ['og:title', 'twitter:title']) ?? (titleTag ? decode(titleTag[1].trim()) : null),
    description: meta(html, ['og:description', 'twitter:description', 'description']),
    image: meta(html, ['og:image', 'twitter:image', 'twitter:image:src']),
    siteName: meta(html, ['og:site_name', 'application-name']),
  };
}
