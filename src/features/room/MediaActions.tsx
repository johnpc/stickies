import { IonIcon } from '@ionic/react';
import { downloadOutline, expandOutline } from 'ionicons/icons';
import { downloadFile } from './downloadFile';
import './mediaSticky.css';

interface MediaActionsProps {
  url: string;
  fileName: string;
  /** Show the expand button (image/video/pdf that pop out to the lightbox). */
  onExpand?: () => void;
}

/** The action row under a media preview: expand (optional) + download.
 * Download fetches the (cross-origin S3) bytes and saves them under the original
 * filename — a plain `<a download>` would be ignored cross-origin and just open
 * the file inline. Previewable kinds also get an expand button. */
export function MediaActions({ url, fileName, onExpand }: MediaActionsProps) {
  return (
    <div className="media-actions">
      {onExpand && (
        <button type="button" data-testid="media-expand" onClick={onExpand}>
          <IonIcon icon={expandOutline} /> Expand
        </button>
      )}
      <button
        type="button"
        data-testid="media-download"
        onClick={() => downloadFile(url, fileName)}
      >
        <IonIcon icon={downloadOutline} /> Download
      </button>
    </div>
  );
}
