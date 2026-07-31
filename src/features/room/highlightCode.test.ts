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

  it('skips slow auto-detection on a huge blob but still escapes it (no freeze)', () => {
    // Regression: hljs.highlightAuto is ~quadratic on a long unstructured line
    // (~56s at 40k chars), freezing every viewer. A blob past the threshold must
    // render fast as escaped plaintext (no detected language), not auto-detect.
    const blob = '<b>' + 'a'.repeat(20_000);
    const t0 = performance.now();
    const out = highlightCode(blob);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(500); // would be seconds via highlightAuto
    expect(out.language).toBeNull();
    expect(out.html).toContain('&lt;b&gt;'); // still escaped → XSS-safe
  });

  it('still highlights a huge blob when a language is forced (linear path)', () => {
    const out = highlightCode('x'.repeat(20_000), 'javascript');
    expect(out.language).toBe('javascript');
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
