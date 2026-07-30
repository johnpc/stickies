import { IonContent, IonPage } from '@ionic/react';
import { EmptyState } from '../shell/EmptyState';
import { helpCircleOutline } from 'ionicons/icons';
import { RoomEntry } from '../home/RoomEntry';
import '../home/home.css';

/** Shown when the URL doesn't resolve to a valid room slug (e.g. all-punctuation
 * like /!!!). Rendering the pad there would write orphan stickies into a shared
 * empty-slug bucket that never display — so instead we explain and offer the
 * room-name box to open a real room. */
export function InvalidRoom() {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="home" data-testid="invalid-room">
          <EmptyState
            icon={helpCircleOutline}
            title="That room name won’t work"
            message="Room names need at least one letter or number. Pick one to open a pad:"
          />
          <RoomEntry />
        </div>
      </IonContent>
    </IonPage>
  );
}
