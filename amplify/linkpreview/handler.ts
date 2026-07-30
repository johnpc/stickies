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

/** Resolve a possibly-relative image URL against the page URL. */
function absolutize(image: string | null, base: string): string | null {
  if (!image) return null;
  try {
    return new URL(image, base).toString();
  } catch {
    return null;
  }
}

export const handler: Schema['linkPreview']['functionHandler'] = async (event) => {
  const safe = safeFetchUrl(event.arguments.url);
  if (!safe) return EMPTY;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(safe, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'StickiesLinkPreview/1.0', accept: 'text/html' },
    });
    clearTimeout(timer);
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.includes('text/html')) return EMPTY;
    const html = (await res.text()).slice(0, MAX_BYTES);
    const data = parseOpenGraph(html);
    return { ...data, image: absolutize(data.image, safe) };
  } catch {
    return EMPTY;
  }
};
