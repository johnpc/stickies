import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { copyOutline, downloadOutline, expandOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { useDocText } from './useDocText';
import { useMediaUrl } from './useMediaUrl';
import { docPreview } from './docPreview';
import { docLanguage } from './docLanguage';
import { CodeSticky } from './CodeSticky';
import { Lightbox } from './Lightbox';
import { useCopyAction } from './useCopyAction';
import './mediaSticky.css';

/** A DOC sticky: an uploaded text/code file shown as a highlighted preview (first
 * lines) with expand (full-page lightbox) + copy-all + download. Reuses CodeSticky
 * for the body; language is inferred from the filename extension. */
export function DocSticky({ sticky }: { sticky: StickyRecord }) {
  const [expanded, setExpanded] = useState(false);
  const copy = useCopyAction();
  const { text, isLoading, isError } = useDocText(sticky.content);
  const { url } = useMediaUrl(sticky.content);
  const name = sticky.fileName ?? 'file.txt';

  if (isLoading) return <span className="sticky__text media-sticky__status">Loading…</span>;
  if (isError || text == null) {
    return <span className="sticky__text media-sticky__status">Couldn’t load {name}</span>;
  }

  const { shown, truncated } = docPreview(text, false);
  const language = docLanguage(name);

  return (
    <div className="doc-sticky" data-testid="doc-sticky">
      <div className="doc-sticky__name sk-muted">{name}</div>
      <CodeSticky code={shown} language={language} />
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
          <a href={url} target="_blank" rel="noopener noreferrer" download={name}>
            <IonIcon icon={downloadOutline} /> Download
          </a>
        )}
      </div>
      {expanded && (
        <Lightbox title={name} onClose={() => setExpanded(false)}>
          <CodeSticky code={text} language={language} />
        </Lightbox>
      )}
    </div>
  );
}
