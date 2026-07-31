import { useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { normalizeRoomSlug, prettifyRoomSlug } from '../features/room/roomSlug';
import { useRoomStickies } from '../features/room/useRoomStickies';
import { useStickyMutations } from '../features/room/useStickyMutations';
import { useStickyArrange } from '../features/room/useStickyArrange';
import { useDocumentTitle, DEFAULT_TITLE } from '../features/shell/useDocumentTitle';
import { LoadState } from '../features/shell/LoadState';
import { RoomHeader } from '../features/room/RoomHeader';
import { StickyGrid } from '../features/room/StickyGrid';
import { InvalidRoom } from '../features/room/InvalidRoom';

/** The shared pad for one room. The room name comes straight from the URL and is
 * normalized to a slug — no room entity has to exist first. Everyone on the same
 * URL sees the same live stickies (useRoomStickies subscribes) and can add/edit/
 * delete them (guest-writable by design). A URL that normalizes to an empty slug
 * (all-punctuation) is invalid — we show InvalidRoom rather than a pad that would
 * write orphan stickies into a shared empty bucket. */
export function RoomPage() {
  const { room: rawRoom = '' } = useParams<{ room: string }>();
  const room = normalizeRoomSlug(rawRoom);
  const { stickies, isLoading, isError, refetch } = useRoomStickies(room);
  const { add, addMedia, edit, remove } = useStickyMutations(room, stickies.length);
  const { recolor, reorder } = useStickyArrange(room, stickies.length);
  // Distinguish this room in the tab / history / bookmarks (all rooms otherwise
  // shared the static index.html title). Falls back to the default for an
  // invalid slug — call it unconditionally to respect the rules of hooks.
  useDocumentTitle(room ? `${prettifyRoomSlug(room)} · Stickies` : DEFAULT_TITLE);

  if (!room) return <InvalidRoom />;

  return (
    <IonPage>
      <RoomHeader room={room} count={stickies.length} />
      <IonContent>
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          skeleton={<div className="ion-padding sk-muted">Loading the pad…</div>}
        >
          <StickyGrid
            stickies={stickies}
            onAdd={(content) => add.mutate(content)}
            onUpload={(file) => addMedia.mutate({ file, seed: Date.now() })}
            uploading={addMedia.isPending}
            onEdit={(id, content) => edit.mutate({ id, content })}
            onRecolor={(id, color) => recolor.mutate({ id, color })}
            onReorder={(id, ord) => reorder.mutate({ id, ord })}
            onDelete={(sticky) => remove.mutate(sticky)}
          />
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
