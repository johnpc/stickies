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

  // Regression: the gutter numbers each line via codeLines, while the <code>
  // renders the HTML verbatim under white-space: pre. If highlightCode kept a
  // trailing newline that codeLines strips, the source rendered ONE extra empty
  // line with no gutter number — shifting every number below out of alignment.
  // Both must derive the same line count for EVERY input, trailing \n or not.
  it.each(['a\nb\nc', 'a\nb\n', 'a\nb\n\n\n', 'x', 'x\n', 'const a = 1;\n'])(
    'renders exactly as many lines as the gutter numbers (%j)',
    (code) => {
      const gutter = codeLines(code).length;
      const rendered = highlightCode(code, 'plaintext').html.split('\n').length;
      expect(rendered).toBe(gutter);
    },
  );
});

describe('codeLines', () => {
  it('splits into lines and drops a single trailing newline', () => {
    expect(codeLines('a\nb\n')).toEqual(['a', 'b']);
  });

  it('keeps a single line as one entry', () => {
    expect(codeLines('solo')).toEqual(['solo']);
  });
});
