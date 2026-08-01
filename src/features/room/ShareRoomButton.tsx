import { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { ShareRoomPanel } from './ShareRoomPanel';
import { shareableRoomUrl } from './shareableRoomUrl';

/** Opens the share panel (URL + copy + QR) for the current room — the URL is the
 * only key a room needs, so sharing it (paste or scan) is how you invite others.
 * We share the CANONICAL web URL (shareableRoomUrl), not window.location.href:
 * inside the native app location.href is `capacitor://localhost/<room>`, which
 * opens nothing for the recipient. */
export function ShareRoomButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IonButton data-testid="room-share" aria-label="Share room" onClick={() => setOpen(true)}>
        <IonIcon slot="icon-only" icon={shareOutline} />
      </IonButton>
      {open && <ShareRoomPanel url={shareableRoomUrl()} onClose={() => setOpen(false)} />}
    </>
  );
}
