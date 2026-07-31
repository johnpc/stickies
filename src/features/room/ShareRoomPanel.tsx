import { IonIcon } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { Lightbox } from './Lightbox';
import { useQrCode } from './useQrCode';
import { useCopyAction } from './useCopyAction';
import './shareRoom.css';

interface ShareRoomPanelProps {
  url: string;
  onClose: () => void;
}

/** The share panel: the room URL (copyable) + a QR code of it so anyone can scan
 * to join the same pad from their phone. Rendered in the full-page Lightbox. */
export function ShareRoomPanel({ url, onClose }: ShareRoomPanelProps) {
  const qr = useQrCode(url);
  const copy = useCopyAction();
  return (
    <Lightbox title="Share this room" onClose={onClose}>
      <div className="share-room" data-testid="share-panel">
        {qr ? (
          <img
            className="share-room__qr"
            src={qr}
            alt="QR code for this room"
            data-testid="share-qr"
          />
        ) : (
          <div className="share-room__qr share-room__qr--pending" aria-hidden="true" />
        )}
        <p className="share-room__hint sk-muted">Scan to open this room, or copy the link:</p>
        <div className="share-room__url">
          <span className="share-room__link" data-testid="share-url">
            {url}
          </span>
          <button
            className="share-room__copy"
            data-testid="share-copy"
            // Copy the URL shown in the panel; useCopyAction toasts on BOTH
            // success and failure (a blocked clipboard used to be silent here).
            onClick={() => copy(url)}
          >
            <IonIcon icon={copyOutline} /> Copy
          </button>
        </div>
      </div>
    </Lightbox>
  );
}
