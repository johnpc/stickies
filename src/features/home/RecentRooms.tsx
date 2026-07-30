import { IonIcon } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import type { RoomRecord } from '../../lib/dataClient';
import { prettifyRoomSlug } from '../room/roomSlug';
import './home.css';

/** The list of most-recently-edited rooms — tap one to join the same pad. Pure
 * presentation; the data + load states come from the home page. */
export function RecentRooms({ rooms }: { rooms: RoomRecord[] }) {
  return (
    <ul className="recent-rooms" data-testid="recent-rooms">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link className="recent-rooms__item" to={`/${room.slug}`} data-testid="recent-room">
            <IonIcon className="recent-rooms__icon" icon={documentTextOutline} aria-hidden="true" />
            <span className="recent-rooms__name">{prettifyRoomSlug(room.slug)}</span>
            <span className="recent-rooms__count sk-muted">
              {room.stickyCount ?? 0} {room.stickyCount === 1 ? 'sticky' : 'stickies'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
