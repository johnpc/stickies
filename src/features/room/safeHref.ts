/**
 * URL safety for LINK stickies. A room is world-writable, so a sticky's content
 * is fully attacker-controlled — rendering it as an <a href> without guarding
 * lets `javascript:`/`data:`/`vbscript:` URLs run script when tapped. Every
 * user-supplied href MUST pass through safeHref before it reaches the DOM.
 *
 * Pure over its input (no DOM), so it's unit-testable and reusable server-side.
 */

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

// A bare email address: one @, no spaces, a dotted domain on the right. Kept
// deliberately simple — it only needs to beat the domain-shaped test below so an
// email becomes a mailto: link, not an https:// link with the local part as
// userinfo (`alex@example.com` → `https://alex@example.com/`, which navigates to
// example.com — wrong and confusing).
const BARE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WRAP_PAIRS: Record<string, string> = { '(': ')', '[': ']', '<': '>', '"': '"', "'": "'" };
// Sentence punctuation that clings to a URL pasted from prose.
const TRAILING_PUNCT = /[.,;:!?]+$/;

/**
 * Trim punctuation a URL picks up from surrounding prose so it doesn't become a
 * broken link: matched wrapping pairs — "(https://x.com)" → "https://x.com" —
 * plus trailing sentence punctuation ("https://x.com." / ",") and a dangling
 * close-bracket with no opener ("(see https://x.com)" once the paste is just the
 * tail). Conservative: only strips a close-bracket when the string has no
 * matching opener, so a legit "…/Foo_(bar)" URL keeps its parens.
 */
function stripUrlPunctuation(s: string): string {
  let v = s;
  // Peel matched wrapping pairs around the WHOLE string.
  while (v.length >= 2 && WRAP_PAIRS[v[0]] === v[v.length - 1]) {
    v = v.slice(1, -1).trim();
  }
  // Trailing sentence punctuation.
  v = v.replace(TRAILING_PUNCT, '');
  // A dangling ) or ] at the end with no matching opener in the string.
  for (const [open, close] of [
    ['(', ')'],
    ['[', ']'],
  ]) {
    if (v.endsWith(close) && !v.includes(open)) v = v.slice(0, -1);
  }
  return v.replace(TRAILING_PUNCT, '');
}

/**
 * A safe href for a user-supplied URL, or null if it can't be made safe.
 * - Trims wrapping / trailing punctuation ("(https://x.com)." → "https://x.com").
 * - Turns a bare email ("a@b.com") into a `mailto:` link.
 * - Adds `https://` to a bare host ("example.com") so it's a real link.
 * - Accepts only http/https/mailto/tel; rejects javascript:/data:/etc.
 */
export function safeHref(raw: string): string | null {
  const trimmed = stripUrlPunctuation(raw.trim());
  if (!trimmed) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  // A scheme-less email → mailto: (before the domain-shaped test, which an email
  // also passes but would wrongly turn into https://local@host/).
  if (!hasScheme && BARE_EMAIL.test(trimmed)) return `mailto:${trimmed}`;
  // A scheme-less value gets https:// ONLY if it's domain-shaped (has a dot and
  // no spaces) — so "example.com" links out but a bare word like "hello" does
  // not become "https://hello/" and read as a link.
  if (!hasScheme && !/^[^\s]+\.[^\s]+$/.test(trimmed)) return null;
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return SAFE_SCHEMES.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** Whether a raw string resolves to a safe, linkable URL. */
export function isLinkLike(raw: string): boolean {
  return safeHref(raw) !== null;
}
