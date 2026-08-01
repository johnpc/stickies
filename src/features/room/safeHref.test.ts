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

  it('strips wrapping + trailing punctuation a URL picks up from prose', () => {
    // Regression: these used to become broken links like https://(https//example.com).
    expect(safeHref('(https://example.com)')).toBe('https://example.com/');
    expect(safeHref('[https://example.com]')).toBe('https://example.com/');
    expect(safeHref('"https://example.com"')).toBe('https://example.com/');
    expect(safeHref('https://example.com,')).toBe('https://example.com/');
    expect(safeHref('https://example.com.')).toBe('https://example.com/');
    // A dangling close-paren with no opener (the tail of "(see https://x.com/a)").
    expect(safeHref('https://example.com/a).')).toBe('https://example.com/a');
    // A dangling `>` from an angle-bracket URL whose leading `<` was split off
    // (<https://example.com> tokenized to https://example.com>). A real URL never
    // ends in a literal `>`, so strip it rather than reject the whole link.
    expect(safeHref('https://example.com>')).toBe('https://example.com/');
  });

  it('keeps parentheses that are part of the URL (e.g. a Wikipedia path)', () => {
    const wiki = 'https://en.wikipedia.org/wiki/Foo_(bar)';
    expect(safeHref(wiki)).toBe(wiki);
  });

  it('allows mailto and tel', () => {
    expect(safeHref('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(safeHref('tel:+15551234')).toBe('tel:+15551234');
  });

  it('turns a bare email into a mailto link (not a broken https link)', () => {
    // Regression: "alex@example.com" used to become "https://alex@example.com/"
    // (navigates to example.com with the local part as basic-auth userinfo).
    expect(safeHref('alex@example.com')).toBe('mailto:alex@example.com');
    expect(safeHref('  a.b@sub.example.co.uk ')).toBe('mailto:a.b@sub.example.co.uk');
  });

  it('does not treat a bare word or a spaced value as an email', () => {
    expect(safeHref('not an email @ x')).toBeNull();
    expect(safeHref('@handle')).toBeNull();
  });

  it('rejects javascript:, data:, and vbscript: URLs (XSS guard)', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>1</script>')).toBeNull();
    expect(safeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects an http(s) URL with embedded credentials (userinfo phishing)', () => {
    // `https://apple.com@evil.com` reads as apple.com but NAVIGATES to evil.com —
    // a deceptive link on a world-writable pad. Drop it rather than render a live
    // anchor whose text lies about its destination.
    expect(safeHref('https://apple.com@evil.com')).toBeNull();
    expect(safeHref('https://apple.com@evil.com/login')).toBeNull();
    expect(safeHref('http://paypal.com@192.168.1.1')).toBeNull();
    expect(safeHref('https://user@example.com')).toBeNull();
    // A legit URL to the same host (no userinfo) still links.
    expect(safeHref('https://example.com')).toBe('https://example.com/');
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
