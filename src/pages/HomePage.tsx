import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons } from '@ionic/react';
import { useRecentRooms } from '../features/room/useRecentRooms';
import { LoadState } from '../features/shell/LoadState';
import { ThemeToggle } from '../features/shell/ThemeToggle';
import { HowItWorks } from '../features/home/HowItWorks';
import { RoomEntry } from '../features/home/RoomEntry';
import { RecentRooms } from '../features/home/RecentRooms';
import '../features/home/home.css';

/** The landing page (no room in the URL): explains what Stickies is, lets you
 * open any room by name, and lists the most-recently-edited rooms to jump into. */
export function HomePage() {
  const { rooms, isLoading, isError, refetch } = useRecentRooms(10);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Stickies</IonTitle>
          <IonButtons slot="end">
            <ThemeToggle />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="home">
          <h1 className="sk-heading home__hero">A shared sticky pad at any URL</h1>
          <p className="sk-muted home__tagline">
            No account, no setup — just pick a room name and start sharing.
          </p>
          <RoomEntry />
          <HowItWorks />

          <h2 className="sk-kicker home__recent-heading">Recently edited rooms</h2>
          <LoadState
            isLoading={isLoading}
            isError={isError}
            isEmpty={rooms.length === 0}
            onRetry={refetch}
            emptyTitle="No rooms yet"
            emptyMessage="Open a room above to create the first pad."
          >
            <RecentRooms rooms={rooms} />
          </LoadState>
        </div>
      </IonContent>
    </IonPage>
  );
}
