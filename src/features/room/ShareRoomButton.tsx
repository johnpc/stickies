import { IonButton, IonIcon } from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { copyCurrentUrl } from './copyCurrentUrl';

/** Copies the current room URL to the clipboard so it can be pasted to whoever
 * you want to share the pad with — the URL is the only key a room needs. */
export function ShareRoomButton({ onCopied }: { onCopied: () => void }) {
  return (
    <IonButton
      data-testid="room-share"
      aria-label="Copy room link"
      onClick={async () => {
        if (await copyCurrentUrl()) onCopied();
      }}
    >
      <IonIcon slot="icon-only" icon={shareOutline} />
    </IonButton>
  );
}
