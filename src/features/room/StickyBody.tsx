import type { StickyRecord } from '../../lib/dataClient';
import { safeHref } from './safeHref';
import { CodeSticky } from './CodeSticky';

/** Renders a sticky's body by kind: CODE → highlighted snippet, LINK → a guarded
 * anchor (safeHref blocks javascript:/data: on the world-writable pad), else plain
 * text. Pure presentation; kind routing lives here so StickyCard stays a shell. */
export function StickyBody({ sticky }: { sticky: StickyRecord }) {
  if (sticky.kind === 'CODE') {
    return <CodeSticky code={sticky.content} language={sticky.language} />;
  }
  const href = sticky.kind === 'LINK' ? safeHref(sticky.content) : null;
  if (href) {
    return (
      <a className="sticky__link" href={href} target="_blank" rel="noopener noreferrer">
        {sticky.content}
      </a>
    );
  }
  return <span className="sticky__text">{sticky.content}</span>;
}
