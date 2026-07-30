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

/** True if a hostname is an IP (or bracketed IPv6) in a private/link-local range. */
function isPrivateAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (host.includes(':')) return host.startsWith('fd') || host.startsWith('fe80') || host === '::1';
  const p = host.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  return PRIVATE_V4.some((inRange) => inRange(p));
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
