import { describe, expect, it } from 'vitest';
import { safeFetchUrl } from './safeFetchUrl';

describe('safeFetchUrl', () => {
  it('allows public http(s) URLs', () => {
    expect(safeFetchUrl('https://example.com/x')).toBe('https://example.com/x');
    expect(safeFetchUrl('http://news.site/a')).toBe('http://news.site/a');
  });

  it('refuses non-http(s) schemes', () => {
    expect(safeFetchUrl('ftp://example.com')).toBeNull();
    expect(safeFetchUrl('file:///etc/passwd')).toBeNull();
    expect(safeFetchUrl('javascript:alert(1)')).toBeNull();
  });

  it('blocks localhost and loopback', () => {
    expect(safeFetchUrl('http://localhost/x')).toBeNull();
    expect(safeFetchUrl('http://127.0.0.1/x')).toBeNull();
    expect(safeFetchUrl('http://[::1]/x')).toBeNull();
  });

  it('blocks private and link-local IP ranges (incl. cloud metadata)', () => {
    expect(safeFetchUrl('http://10.0.0.5/')).toBeNull();
    expect(safeFetchUrl('http://192.168.1.1/')).toBeNull();
    expect(safeFetchUrl('http://172.16.0.9/')).toBeNull();
    expect(safeFetchUrl('http://169.254.169.254/latest/meta-data/')).toBeNull();
  });

  it('allows a public IP that is not private', () => {
    expect(safeFetchUrl('http://8.8.8.8/')).toBe('http://8.8.8.8/');
  });

  it('blocks IPv4-mapped IPv6 addresses to internal hosts (SSRF bypass)', () => {
    // Node compresses these to hex (::ffff:7f00:1 / ::ffff:a9fe:a9fe); a naive
    // fd/fe80 prefix check let them tunnel an internal IPv4 through.
    expect(safeFetchUrl('http://[::ffff:127.0.0.1]/')).toBeNull();
    expect(safeFetchUrl('http://[::ffff:169.254.169.254]/latest/meta-data/')).toBeNull();
    expect(safeFetchUrl('http://[::ffff:10.0.0.1]/')).toBeNull();
  });

  it('blocks decimal/hex IPv4 encodings of loopback (normalized by URL parser)', () => {
    expect(safeFetchUrl('http://2130706433/')).toBeNull(); // 127.0.0.1
    expect(safeFetchUrl('http://0x7f000001/')).toBeNull();
  });

  it('blocks unique-local (fc00::/7) and link-local (fe80::/10) IPv6', () => {
    expect(safeFetchUrl('http://[fd00::1]/')).toBeNull();
    expect(safeFetchUrl('http://[fc00::1]/')).toBeNull();
    expect(safeFetchUrl('http://[fe80::1]/')).toBeNull();
    expect(safeFetchUrl('http://[::]/')).toBeNull();
  });

  it('still allows a public IPv6 address (not over-blocked)', () => {
    expect(safeFetchUrl('http://[2606:4700:4700::1111]/')).toBe('http://[2606:4700:4700::1111]/');
  });

  it('returns null for unparseable input', () => {
    expect(safeFetchUrl('not a url')).toBeNull();
  });
});
