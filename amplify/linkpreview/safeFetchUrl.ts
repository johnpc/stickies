/**
 * SSRF guard for the link-preview fetch. The URL is fully attacker-controlled
 * (anyone can post a LINK sticky), so before the Lambda fetches it we ensure it's
 * an http(s) URL to a PUBLIC host — never localhost, a private/link-local IP, or
 * cloud metadata (169.254.169.254). Pure over its input so it's unit-testable.
 *
 * Returns the normalized URL string to fetch, or null to refuse.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
]);

// Private / loopback / link-local IPv4 ranges (link-local 169.254 covers cloud
// metadata). Each predicate takes the 4 octets; kept as a table so the check is
// a single `.some`, not one giant boolean expression (lower cyclomatic).
const PRIVATE_V4: ((p: number[]) => boolean)[] = [
  (p) => p[0] === 10,
  (p) => p[0] === 127,
  (p) => p[0] === 192 && p[1] === 168,
  (p) => p[0] === 172 && p[1] >= 16 && p[1] <= 31,
  (p) => p[0] === 169 && p[1] === 254,
];

/** True if four octets fall in a private/loopback/link-local IPv4 range. */
function isPrivateV4(p: number[]): boolean {
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  return PRIVATE_V4.some((inRange) => inRange(p));
}

// IPv6 that must match EXACTLY: loopback and the unspecified address (a bare
// `::` prefix would wrongly match every compressed IPv6, so these aren't prefixes).
const PRIVATE_V6_EXACT = new Set(['::1', '::']);
// IPv6 PREFIXES: unique-local fc00::/7 (fc/fd) and link-local fe80::/10 (fe8-feb).
const PRIVATE_V6_PREFIXES = ['fc', 'fd', 'fe8', 'fe9', 'fea', 'feb'];

/** The embedded IPv4 octets of an IPv6-mapped/compat address, else null. Node's
 * URL parser compresses `::ffff:127.0.0.1` to `::ffff:7f00:1`, so accept both a
 * dotted tail and two trailing hex hextets after `ffff:`. */
function mappedV4(host: string): number[] | null {
  const dotted = host.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (dotted) return dotted.slice(1).map(Number);
  const m = host.match(/ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!m) return null;
  const hi = parseInt(m[1], 16);
  const lo = parseInt(m[2], 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255];
}

/**
 * True if a hostname is an IP (or bracketed IPv6) in a private/loopback/
 * link-local range. Node's URL parser normalizes decimal/hex/octal IPv4 back to
 * dotted-quad, so those are covered by the V4 check. The IPv6 branch must also
 * catch IPv4-MAPPED addresses (`::ffff:a.b.c.d`, compressed to hex) — the SSRF
 * hole where an internal IPv4 tunneled through a v6 literal slipped past a naive
 * prefix check.
 */
function isPrivateAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host.includes(':')) {
    const mapped = mappedV4(host);
    if (mapped && isPrivateV4(mapped)) return true;
    return PRIVATE_V6_EXACT.has(host) || PRIVATE_V6_PREFIXES.some((pre) => host.startsWith(pre));
  }
  return isPrivateV4(host.split('.').map(Number));
}

export function safeFetchUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!host || BLOCKED_HOSTNAMES.has(host) || isPrivateAddress(host)) return null;
  return url.toString();
}
