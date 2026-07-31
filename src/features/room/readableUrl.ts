/**
 * A human-readable form of a room URL for DISPLAY + COPY in the share panel.
 * `window.location.href` percent-encodes a non-ASCII room slug, so a unicode room
 * ("日本語ノート") showed as an unreadable wall of `%E6%97%A5…` in the panel and
 * got copied that way. Browsers accept the decoded form in the address bar / a
 * pasted link (verified: it navigates to the same room), so show the friendly
 * version. The QR still encodes the RAW href — scanners want the canonical
 * percent-encoded URL. Pure; falls back to the input if decoding fails.
 */
export function readableUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Decode only the path (+ any query/hash) — origin is already ASCII. A
    // malformed %-sequence would throw; the catch returns the raw url unchanged.
    return u.origin + decodeURIComponent(u.pathname) + u.search + u.hash;
  } catch {
    return raw;
  }
}
