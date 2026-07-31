import { IonBackButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { ThemeToggle } from '../shell/ThemeToggle';
import { ShareRoomButton } from './ShareRoomButton';
import { PresenceBadge } from './PresenceBadge';
import { prettifyRoomSlug } from './roomSlug';
import './roomHeader.css';

interface RoomHeaderProps {
  room: string;
  count: number;
}

/** The pad's toolbar: back to home, the room's pretty title + sticky count, a
 * copy-link share button, and the theme switch. */
export function RoomHeader({ room, count }: RoomHeaderProps) {
  const title = prettifyRoomSlug(room) || 'Room';

  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/" text="" />
        </IonButtons>
        <IonTitle>
          <span className="room-header__wrap">
            <span className="room-header__title" data-testid="room-title">
              {title}
            </span>
            <span className="room-header__count sk-muted" data-testid="room-count">
              {' '}
              · {count}
            </span>
          </span>
        </IonTitle>
        <IonButtons slot="end">
          <PresenceBadge room={room} />
          <ShareRoomButton />
          <ThemeToggle />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}
