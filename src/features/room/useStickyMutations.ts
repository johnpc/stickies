import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StickyRecord } from '../../lib/dataClient';
import { createSticky, updateStickyContent, deleteSticky } from './stickiesApi';
import { restoreSticky } from './restoreSticky';
import { createMediaSticky } from './createMediaSticky';
import { classifyContent } from './classifyContent';
import { showToast } from '../shell/toastBus';
import { notifyWriteError } from './notifyWriteError';
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
    onError: (error, raw) => notifyWriteError(error, () => add.mutate(raw)),
  });

  const addMedia = useMutation({
    // seed keys the S3 object; a wall-clock stamp is fine here (not pure logic).
    mutationFn: (input: { file: File; seed: number }) =>
      createMediaSticky({ room, file: input.file, existingCount: count, seed: input.seed }),
    onSuccess: settle,
    onError: (error, input) => notifyWriteError(error, () => addMedia.mutate(input)),
  });

  const edit = useMutation({
    mutationFn: (vars: { id: string; content: string }) => {
      // Reclassify on edit so a note edited into a URL becomes a LINK, a fenced
      // block becomes CODE, etc. — not stuck on its original kind.
      const { kind, content, language } = classifyContent(vars.content);
      return updateStickyContent(vars.id, room, { kind, content, language }, count);
    },
    onSuccess: settle,
    onError: (error, vars) => notifyWriteError(error, () => edit.mutate(vars)),
  });

  const restore = useMutation({
    mutationFn: (sticky: StickyRecord) => restoreSticky(sticky, room, count + 1),
    onSuccess: settle,
    onError: (error, sticky) => notifyWriteError(error, () => restore.mutate(sticky)),
  });

  const remove = useMutation({
    mutationFn: (sticky: StickyRecord) => deleteSticky(sticky.id, room, Math.max(0, count - 1)),
    onSuccess: (_data, sticky) => {
      settle();
      // Offer a brief undo — the pad is world-writable, so an accidental delete
      // (by anyone) should be recoverable. Re-creates the sticky as it was.
      showToast('Sticky deleted', { label: 'Undo', run: () => restore.mutate(sticky) });
    },
    onError: (error, sticky) => notifyWriteError(error, () => remove.mutate(sticky)),
  });

  return { add, addMedia, edit, remove };
}
