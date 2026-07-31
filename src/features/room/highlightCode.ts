import hljs from 'highlight.js/lib/common';

export interface Highlighted {
  /** Highlighted HTML (hljs-classed spans), safe to inject — hljs escapes text. */
  html: string;
  /** The detected (or forced) language name, or null when unknown. */
  language: string | null;
}

/** Above this, skip AUTO-detection. hljs.highlightAuto is ~quadratic on a long
 * unstructured line (a minified blob: ~0.9s at 5k chars, ~56s at 40k), which
 * would freeze the render. A forced-language highlight is linear, so a real
 * snippet with a language hint is unaffected — only auto-detect is guarded. */
const AUTODETECT_MAX_CHARS = 4000;

/**
 * Syntax-highlight a code string with highlight.js. When `language` is a known
 * hljs language it's forced; otherwise hljs auto-detects — SKIPPED above
 * AUTODETECT_MAX_CHARS (falls back to escaped plaintext) so a huge unstructured
 * blob can't freeze the render. Returns escaped HTML (hljs entity-encodes the
 * source, so injecting it is XSS-safe) plus the resolved language. Isolated here
 * so the component stays a pure renderer and this is the one place touching hljs.
 */
export function highlightCode(code: string, language?: string | null): Highlighted {
  if (language && hljs.getLanguage(language)) {
    const { value } = hljs.highlight(code, { language });
    return { html: value, language };
  }
  if (code.length > AUTODETECT_MAX_CHARS) {
    const { value } = hljs.highlight(code, { language: 'plaintext' });
    return { html: value, language: null };
  }
  const { value, language: detected } = hljs.highlightAuto(code);
  return { html: value, language: detected ?? null };
}

/** Split code into its lines for a line-number gutter (keeps trailing empties
 * out so a single-line snippet shows one number, not two). */
export function codeLines(code: string): string[] {
  return code.replace(/\n$/, '').split('\n');
}
