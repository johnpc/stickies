import { describe, expect, it } from 'vitest';
import { isLinkLike, safeHref } from './safeHref';

describe('safeHref', () => {
  it('passes through http and https URLs', () => {
    expect(safeHref('https://example.com/x')).toBe('https://example.com/x');
    expect(safeHref('http://example.com')).toBe('http://example.com/');
  });

  it('adds https:// to a bare domain', () => {
    expect(safeHref('example.com')).toBe('https://example.com/');
  });

  it('allows mailto and tel', () => {
    expect(safeHref('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(safeHref('tel:+15551234')).toBe('tel:+15551234');
  });

  it('rejects javascript:, data:, and vbscript: URLs (XSS guard)', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>1</script>')).toBeNull();
    expect(safeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('returns null for empty or unparseable input', () => {
    expect(safeHref('   ')).toBeNull();
    expect(safeHref('http://')).toBeNull();
  });
});

describe('isLinkLike', () => {
  it('is true for a safe URL and false for a script URL', () => {
    expect(isLinkLike('example.com')).toBe(true);
    expect(isLinkLike('javascript:alert(1)')).toBe(false);
  });
});
