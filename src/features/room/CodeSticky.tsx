import { useMemo } from 'react';
import { highlightCode, codeLines } from './highlightCode';
import 'highlight.js/styles/github.css';
import './codeSticky.css';

interface CodeStickyProps {
  code: string;
  language?: string | null;
}

/** Renders a CODE sticky's body: a language tag, a line-number gutter, and the
 * syntax-highlighted source. Pure renderer — highlighting lives in a helper. */
export function CodeSticky({ code, language }: CodeStickyProps) {
  const { html, language: resolved } = useMemo(
    () => highlightCode(code, language),
    [code, language],
  );
  const lines = useMemo(() => codeLines(code), [code]);

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
    </div>
  );
}
