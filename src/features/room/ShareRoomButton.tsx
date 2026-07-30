import { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { ShareRoomPanel } from './ShareRoomPanel';

/** Opens the share panel (URL + copy + QR) for the current room — the URL is the
 * only key a room needs, so sharing it (paste or scan) is how you invite others. */
export function ShareRoomButton({ onCopied }: { onCopied: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IonButton data-testid="room-share" aria-label="Share room" onClick={() => setOpen(true)}>
        <IonIcon slot="icon-only" icon={shareOutline} />
      </IonButton>
      {open && (
        <ShareRoomPanel
          url={window.location.href}
          onClose={() => setOpen(false)}
          onCopied={onCopied}
        />
      )}
    </>
  );
}
