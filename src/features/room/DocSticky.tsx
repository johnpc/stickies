import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { copyOutline, downloadOutline, expandOutline, refreshOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { useDocText } from './useDocText';
import { useMediaUrl } from './useMediaUrl';
import { docPreview } from './docPreview';
import { docLanguage } from './docLanguage';
import { CodeSticky } from './CodeSticky';
import { Lightbox } from './Lightbox';
import { useCopyAction } from './useCopyAction';
import { downloadFile } from './downloadFile';
import './mediaSticky.css';

/** A DOC sticky: an uploaded text/code file shown as a highlighted preview (first
 * lines) with expand (full-page lightbox) + copy-all + download. Reuses CodeSticky
 * for the body; language is inferred from the filename extension. */
export function DocSticky({ sticky }: { sticky: StickyRecord }) {
  const [expanded, setExpanded] = useState(false);
  const copy = useCopyAction();
  const { text, truncated: capped, isLoading, isError, retry } = useDocText(sticky.content);
  const { url } = useMediaUrl(sticky.content);
  const name = sticky.fileName ?? 'file.txt';

  if (isLoading) return <span className="sticky__text media-sticky__status">Loading…</span>;
  if (isError || text == null) {
    // The text PREVIEW failed, but the uploaded file itself is intact. The signed
    // URL may simply have expired (there's no auto-retry here), so offer Retry to
    // re-sign + re-fetch, plus Download so the sticky is never a dead end.
    return (
      <div className="doc-sticky" data-testid="doc-sticky">
        <span className="sticky__text media-sticky__status">Couldn’t load a preview of {name}</span>
        <div className="doc-sticky__actions">
          <button data-testid="doc-retry" onClick={retry}>
            <IonIcon icon={refreshOutline} /> Retry
          </button>
          {url && (
            <button data-testid="doc-download" onClick={() => downloadFile(url, name)}>
              <IonIcon icon={downloadOutline} /> Download
            </button>
          )}
        </div>
      </div>
    );
  }

  const { shown, truncated } = docPreview(text, false);
  const language = docLanguage(name);

  return (
    <div className="doc-sticky" data-testid="doc-sticky">
      <div className="doc-sticky__name sk-muted">{name}</div>
      <CodeSticky code={shown} language={language} hideTruncationNote={capped} />
      <div className="doc-sticky__actions">
        {truncated && (
          <button data-testid="doc-expand" onClick={() => setExpanded(true)}>
            <IonIcon icon={expandOutline} /> Expand
          </button>
        )}
        <button data-testid="doc-copy" onClick={() => copy(text)}>
          <IonIcon icon={copyOutline} /> Copy
        </button>
        {url && (
          <button data-testid="doc-download" onClick={() => downloadFile(url, name)}>
            <IonIcon icon={downloadOutline} /> Download
          </button>
        )}
      </div>
      {expanded && (
        <Lightbox title={name} onClose={() => setExpanded(false)}>
          {capped && (
            <p className="doc-sticky__truncated sk-muted" data-testid="doc-truncated">
              Preview truncated — Download for the full file.
            </p>
          )}
          {/* When the file was capped at 256KB, the DOC "Download for the full
              file" note above is the accurate source of truth — suppress CodeSticky's
              own "use Copy for the full snippet", since Copy only holds that prefix. */}
          <CodeSticky code={text} language={language} full hideTruncationNote={capped} />
        </Lightbox>
      )}
    </div>
  );
}
