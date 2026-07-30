import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { copyOutline, expandOutline } from 'ionicons/icons';
import { CodeSticky } from './CodeSticky';
import { Lightbox } from './Lightbox';
import { copyText } from './copyText';
import './mediaSticky.css';

interface ExpandableCodeProps {
  code: string;
  language?: string | null;
  title?: string;
}

/** A CODE sticky body: the highlighted snippet plus Copy + Expand actions. Expand
 * pops the full code into a full-page lightbox (list-view cards are cramped for
 * anything long); Copy puts the raw source on the clipboard. Reuses CodeSticky. */
export function ExpandableCode({ code, language, title = 'Snippet' }: ExpandableCodeProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="media-sticky">
      <CodeSticky code={code} language={language} />
      <div className="media-actions">
        <button type="button" data-testid="code-copy" onClick={() => copyText(code)}>
          <IonIcon icon={copyOutline} /> Copy
        </button>
        <button type="button" data-testid="code-expand" onClick={() => setExpanded(true)}>
          <IonIcon icon={expandOutline} /> Expand
        </button>
      </div>
      {expanded && (
        <Lightbox title={title} onClose={() => setExpanded(false)}>
          <CodeSticky code={code} language={language} />
        </Lightbox>
      )}
    </div>
  );
}
