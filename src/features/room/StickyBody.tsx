import { lazy, Suspense } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { safeHref } from './safeHref';
import { isMediaKind } from './isMediaKind';

// highlight.js is heavy; only pull it (and CodeSticky) when a room actually
// renders a CODE sticky, so text/link-only pads don't pay for it at first paint.
const CodeSticky = lazy(() => import('./CodeSticky').then((m) => ({ default: m.CodeSticky })));
// MediaSticky pulls the storage client; lazy so text/link/code pads skip it.
const MediaSticky = lazy(() => import('./MediaSticky').then((m) => ({ default: m.MediaSticky })));
// DocSticky (uploaded text/code preview) also pulls storage + highlight.js.
const DocSticky = lazy(() => import('./DocSticky').then((m) => ({ default: m.DocSticky })));

const loading = <span className="sticky__text media-sticky__status">Loading…</span>;

/** Renders a sticky's body by kind: CODE → highlighted snippet, DOC → uploaded
 * text/code preview, other media → image/video/pdf/file, LINK → a guarded anchor
 * (safeHref blocks javascript:/data: on the world-writable pad), else plain text.
 * Heavy renderers are lazy-loaded. Kind routing lives here so StickyCard stays a
 * shell. */
export function StickyBody({ sticky }: { sticky: StickyRecord }) {
  if (sticky.kind === 'CODE') {
    return (
      <Suspense fallback={<span className="sticky__text">{sticky.content}</span>}>
        <CodeSticky code={sticky.content} language={sticky.language} />
      </Suspense>
    );
  }
  if (sticky.kind === 'DOC') {
    return <Suspense fallback={loading}>{<DocSticky sticky={sticky} />}</Suspense>;
  }
  if (isMediaKind(sticky.kind)) {
    return (
      <Suspense fallback={loading}>
        <MediaSticky sticky={sticky} />
      </Suspense>
    );
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
