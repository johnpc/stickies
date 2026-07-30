import hljs from 'highlight.js/lib/common';

export interface Highlighted {
  /** Highlighted HTML (hljs-classed spans), safe to inject — hljs escapes text. */
  html: string;
  /** The detected (or forced) language name, or null when unknown. */
  language: string | null;
}

/**
 * Syntax-highlight a code string with highlight.js. When `language` is a known
 * hljs language it's forced; otherwise hljs auto-detects. Returns escaped HTML
 * (hljs entity-encodes the source, so injecting it is XSS-safe) plus the
 * resolved language. Isolated here so the component stays a pure renderer and
 * this is the one place that touches hljs.
 */
export function highlightCode(code: string, language?: string | null): Highlighted {
  if (language && hljs.getLanguage(language)) {
    const { value } = hljs.highlight(code, { language });
    return { html: value, language };
  }
  const { value, language: detected } = hljs.highlightAuto(code);
  return { html: value, language: detected ?? null };
}

/** Split code into its lines for a line-number gutter (keeps trailing empties
 * out so a single-line snippet shows one number, not two). */
export function codeLines(code: string): string[] {
  return code.replace(/\n$/, '').split('\n');
}
