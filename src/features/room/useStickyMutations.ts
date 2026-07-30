import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StickyRecord } from '../../lib/dataClient';
import { createSticky, updateStickyContent, deleteSticky } from './stickiesApi';
import { createMediaSticky } from './createMediaSticky';
import { classifyContent } from './classifyContent';
import { isMediaKind } from './isMediaKind';
import { roomStickiesKey } from './roomStickiesKey';

/**
 * Add / edit / delete mutations for a room's stickies. The live observeQuery
 * subscription in useRoomStickies normally pushes the change back into the
 * cache; on each success we ALSO invalidate the room query so the pad still
 * refreshes promptly if the subscription is momentarily slow. `count` is the
 * room's current sticky count (from the pad), threaded through so the recents
 * index stays accurate.
 */
export function useStickyMutations(room: string, count: number) {
  const queryClient = useQueryClient();
  const settle = () => queryClient.invalidateQueries({ queryKey: roomStickiesKey(room) });

  const add = useMutation({
    mutationFn: (raw: string) => {
      const { kind, content, language } = classifyContent(raw);
      // seq = a monotonic stamp so rapid adds get distinct ord/color (not the
      // shared render-time count, which collides when adds race).
      return createSticky({ room, kind, content, language, seq: Date.now(), existingCount: count });
    },
    onSuccess: settle,
  });

  const addMedia = useMutation({
    // seed keys the S3 object; a wall-clock stamp is fine here (not pure logic).
    mutationFn: (input: { file: File; seed: number }) =>
      createMediaSticky({ room, file: input.file, existingCount: count, seed: input.seed }),
    onSuccess: settle,
  });

  const edit = useMutation({
    mutationFn: (vars: { id: string; content: string }) =>
      updateStickyContent(vars.id, room, vars.content, count),
    onSuccess: settle,
  });

  const remove = useMutation({
    // Take the whole sticky so media/doc deletes can clean up their S3 object.
    mutationFn: (sticky: StickyRecord) =>
      deleteSticky(
        sticky.id,
        room,
        Math.max(0, count - 1),
        isMediaKind(sticky.kind) ? sticky.content : undefined,
      ),
    onSuccess: settle,
  });

  return { add, addMedia, edit, remove };
}
