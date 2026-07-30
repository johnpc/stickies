import { describe, expect, it } from 'vitest';
import { highlightCode, codeLines } from './highlightCode';

describe('highlightCode', () => {
  it('honors a known forced language', () => {
    const out = highlightCode('const a = 1;', 'javascript');
    expect(out.language).toBe('javascript');
    expect(out.html).toContain('<span');
  });

  it('auto-detects when the language is unknown/omitted', () => {
    const out = highlightCode('def f():\n    return 1');
    expect(out.language).toBeTruthy();
    expect(out.html.length).toBeGreaterThan(0);
  });

  it('escapes HTML in the source (XSS-safe injection)', () => {
    const out = highlightCode('<script>alert(1)</script>', 'xml');
    expect(out.html).not.toContain('<script>alert(1)</script>');
    expect(out.html).toContain('&lt;');
  });
});

describe('codeLines', () => {
  it('splits into lines and drops a single trailing newline', () => {
    expect(codeLines('a\nb\n')).toEqual(['a', 'b']);
  });

  it('keeps a single line as one entry', () => {
    expect(codeLines('solo')).toEqual(['solo']);
  });
});
