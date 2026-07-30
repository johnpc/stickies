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

  it('returns null for unparseable input', () => {
    expect(safeFetchUrl('not a url')).toBeNull();
  });
});
