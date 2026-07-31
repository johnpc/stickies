import { IonIcon } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { useCopyAction } from './useCopyAction';
import { linkifyText } from './linkifyText';
import './mediaSticky.css';

/** A plain TEXT sticky: the note text plus a Copy-to-clipboard action. A URL
 * embedded in the note (with surrounding words) renders as a safe tappable link
 * via linkifyText — guarded by safeHref, so the app's "share a link" purpose
 * works even inside a sentence. dir="auto" keeps RTL notes aligned. The copy
 * button only shows for non-empty text. */
export function TextSticky({ text }: { text: string }) {
  const copy = useCopyAction();
  const runs = linkifyText(text);
  return (
    <div className="media-sticky">
      <span className="sticky__text" dir="auto">
        {runs.map((run, i) =>
          run.href ? (
            <a
              key={i}
              className="sticky__link"
              href={run.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {run.text}
            </a>
          ) : (
            <span key={i}>{run.text}</span>
          ),
        )}
      </span>
      {text.trim() && (
        <div className="media-actions">
          <button type="button" data-testid="text-copy" onClick={() => copy(text)}>
            <IonIcon icon={copyOutline} /> Copy
          </button>
        </div>
      )}
    </div>
  );
}
