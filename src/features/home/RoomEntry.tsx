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
  // The user typed something, but it's all punctuation/emoji → no usable slug.
  // Say so, rather than leaving the Go button silently dead with no explanation.
  const invalid = value.trim() !== '' && slug === '';

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
        // A room name is an IDENTIFIER, not prose: the URL is the only key, so two
        // people must type the SAME thing to meet. Turn off mobile text mangling
        // (iOS autocorrect can silently swap an unfamiliar word → wrong room) and
        // the red spellcheck squiggle.
        autoCorrect="off"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
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
      {invalid && (
        <p className="room-entry__hint" role="alert" data-testid="room-entry-hint">
          Use letters or numbers for a room name.
        </p>
      )}
    </form>
  );
}
