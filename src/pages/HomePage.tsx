import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  useIonViewWillEnter,
} from '@ionic/react';
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

  // Ionic keeps this page MOUNTED in the router-outlet stack while you're in a
  // room (that's how the back-swipe transition works), so react-query's
  // refetchOnMount never re-fires on return and the feed would show a stale
  // snapshot — the room you just edited missing, order/counts frozen. Refetch
  // whenever the cached Home view becomes active again (incl. back navigation).
  useIonViewWillEnter(() => {
    void refetch();
  });

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
            // Only show the loading/error state when there's nothing cached to
            // show. Returning home re-fetches the feed (useIonViewWillEnter); if
            // that background refetch flakes, react-query flips to error while
            // still holding the prior rooms — without this gate a populated,
            // still-valid recents feed would blank to a full-screen error. Keep
            // showing the cached rooms; Retry stays available on a true empty load.
            isLoading={isLoading && rooms.length === 0}
            isError={isError && rooms.length === 0}
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
