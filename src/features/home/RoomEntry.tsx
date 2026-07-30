import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import { normalizeRoomSlug } from '../room/roomSlug';
import './home.css';

/** The "open a room" box on the home page. Whatever the visitor types is
 * normalized to a slug and navigated to — the room needn't exist yet, visiting
 * it IS creating it. Empty/garbage input is a no-op. */
export function RoomEntry() {
  const history = useHistory();
  const [value, setValue] = useState('');
  const slug = normalizeRoomSlug(value);

  const go = () => {
    if (slug) history.push(`/${slug}`);
  };

  return (
    <form
      className="room-entry"
      data-testid="room-entry"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <input
        className="room-entry__input"
        data-testid="room-entry-input"
        value={value}
        placeholder="Pick a room name…"
        aria-label="Room name"
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="room-entry__go"
        data-testid="room-entry-go"
        disabled={!slug}
        aria-label="Open room"
      >
        <IonIcon icon={arrowForwardOutline} />
      </button>
    </form>
  );
}
