import { IonIcon } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { useCopyAction } from './useCopyAction';
import './mediaSticky.css';

/** A plain TEXT sticky: the note text plus a Copy-to-clipboard action. The copy
 * button only shows for non-empty text. */
export function TextSticky({ text }: { text: string }) {
  const copy = useCopyAction();
  return (
    <div className="media-sticky">
      <span className="sticky__text">{text}</span>
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
