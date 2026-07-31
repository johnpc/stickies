import { useMemo } from 'react';
import { highlightCode, codeLines } from './highlightCode';
import { capCode, CODE_EXPANDED_MAX_LINES, CODE_EXPANDED_MAX_CHARS } from './capCode';
import 'highlight.js/styles/github.css';
import './codeSticky.css';

interface CodeStickyProps {
  code: string;
  language?: string | null;
  /** Lightbox variant: render with the much higher expanded caps so Expand
   * actually shows far more than the small on-pad preview (only one snippet
   * renders full-screen, so the "freeze every viewer" risk doesn't apply). */
  full?: boolean;
}

/** Renders a CODE sticky's body: a language tag, a line-number gutter, and the
 * syntax-highlighted source. Pure renderer — highlighting lives in a helper. The
 * RENDERED source is capped (capCode) so a huge/minified snippet can't freeze
 * every viewer's main thread via synchronous highlight.js; the full source stays
 * available via Copy (ExpandableCode). The `full` (lightbox) variant uses much
 * higher caps so Expand reveals more. */
export function CodeSticky({ code, language, full }: CodeStickyProps) {
  const { code: shown, truncated } = useMemo(
    () => (full ? capCode(code, CODE_EXPANDED_MAX_LINES, CODE_EXPANDED_MAX_CHARS) : capCode(code)),
    [code, full],
  );
  const { html, language: resolved } = useMemo(
    () => highlightCode(shown, language),
    [shown, language],
  );
  const lines = useMemo(() => codeLines(shown), [shown]);

  return (
    <div className="code-sticky" data-testid="code-sticky">
      {resolved && (
        <span className="code-sticky__lang" data-testid="code-lang">
          {resolved}
        </span>
      )}
      <div className="code-sticky__scroll">
        <pre className="code-sticky__pre">
          <span className="code-sticky__gutter" aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </span>
          <code className="hljs code-sticky__code" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
      {truncated && (
        <p className="code-sticky__truncated" data-testid="code-truncated">
          Preview truncated — use Copy for the full snippet.
        </p>
      )}
    </div>
  );
}
