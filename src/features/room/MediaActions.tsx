import { IonIcon } from '@ionic/react';
import { downloadOutline, expandOutline } from 'ionicons/icons';
import './mediaSticky.css';

interface MediaActionsProps {
  url: string;
  fileName: string;
  /** Show the expand button (image/video/pdf that pop out to the lightbox). */
  onExpand?: () => void;
}

/** The action row under a media preview: expand (optional) + download. Every
 * media kind gets a download link (the browser saves via the `download` attr);
 * previewable kinds also get an expand button. */
export function MediaActions({ url, fileName, onExpand }: MediaActionsProps) {
  return (
    <div className="media-actions">
      {onExpand && (
        <button type="button" data-testid="media-expand" onClick={onExpand}>
          <IonIcon icon={expandOutline} /> Expand
        </button>
      )}
      <a
        href={url}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="media-download"
      >
        <IonIcon icon={downloadOutline} /> Download
      </a>
    </div>
  );
}
