import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSticky, updateStickyContent, deleteSticky } from './stickiesApi';
import { classifyContent } from './classifyContent';
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
      return createSticky({ room, kind, content, language, existingCount: count });
    },
    onSuccess: settle,
  });

  const edit = useMutation({
    mutationFn: (vars: { id: string; content: string }) =>
      updateStickyContent(vars.id, room, vars.content, count),
    onSuccess: settle,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSticky(id, room, Math.max(0, count - 1)),
    onSuccess: settle,
  });

  return { add, edit, remove };
}
