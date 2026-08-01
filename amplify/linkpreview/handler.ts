/**
 * linkPreview resolver. Guards the user-supplied URL against SSRF, fetches it
 * server-side (browsers can't — CORS), and returns its OpenGraph/meta preview.
 * Fails SOFT: any refusal/error/timeout yields all-null fields so the client
 * simply falls back to the plain link. Only reads the first ~200KB of HTML.
 */
import type { Schema } from '../data/resource';
import { safeFetchUrl } from './safeFetchUrl';
import { parseOpenGraph, type LinkPreviewData } from './parseOpenGraph';

const EMPTY: LinkPreviewData = { title: null, description: null, image: null, siteName: null };
const MAX_BYTES = 200_000;
const MAX_REDIRECTS = 5;
const HEADERS = { 'user-agent': 'StickiesLinkPreview/1.0', accept: 'text/html' };

/** Resolve a possibly-relative image URL against the page URL, keeping ONLY
 * http(s). og:image is attacker-controlled (any page can set it) and flows
 * straight into the client's <img src> on a world-writable pad — so a hostile
 * page could otherwise inject a `data:`/`javascript:`/`file:`/other-scheme URL.
 * Restrict to http(s) so only a normal remote image can ever reach the DOM. */
function absolutize(image: string | null, base: string): string | null {
  if (!image) return null;
  try {
    const url = new URL(image, base);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Fetch following redirects MANUALLY, re-running the SSRF guard on every hop.
 * `redirect: 'follow'` would let a public URL 302 to an internal host that
 * safeFetchUrl never sees (classic SSRF-via-redirect bypass), so each Location is
 * re-validated (resolved relative to the current URL). Returns the response + its
 * final URL, or null if any hop is refused / too many redirects.
 */
async function safeFetch(
  start: string,
  signal: AbortSignal,
): Promise<{ res: Response; url: string } | null> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, { redirect: 'manual', signal, headers: HEADERS });
    if (res.status < 300 || res.status >= 400) return { res, url: current };
    const location = res.headers.get('location');
    if (!location) return { res, url: current };
    const next = safeFetchUrl(new URL(location, current).toString());
    if (!next) return null;
    current = next;
  }
  return null;
}

export const handler: Schema['linkPreview']['functionHandler'] = async (event) => {
  const safe = safeFetchUrl(event.arguments.url);
  if (!safe) return EMPTY;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const hit = await safeFetch(safe, controller.signal);
    if (!hit) return EMPTY;
    const type = hit.res.headers.get('content-type') ?? '';
    if (!hit.res.ok || !type.includes('text/html')) return EMPTY;
    const html = (await hit.res.text()).slice(0, MAX_BYTES);
    const data = parseOpenGraph(html);
    return { ...data, image: absolutize(data.image, hit.url) };
  } catch {
    return EMPTY;
  } finally {
    clearTimeout(timer);
  }
};
