import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { setStickyColor, setStickySize, setStickyOrder } from './stickyArrangeApi';
import { notifyWriteError } from './notifyWriteError';
import { roomStickiesKey } from './roomStickiesKey';
import { sortStickies } from './sortStickies';
import type { StickyRecord } from '../../lib/dataClient';

/** Optimistically patch one sticky's field in the room cache (re-sorted, so an
 * `ord` change lands in its new position); returns a rollback to the prior list.
 * Recolor/resize/reorder are direct-manipulation actions — showing the change
 * instantly (not after the AppSync round-trip) both feels right AND fixes the
 * "recompute from stale state" bugs: the resize S→M→L cycle reads the CURRENT
 * size, and keyboard reorder computes the next move from the CURRENT order — so a
 * second action before the write lands must see the optimistic value or it writes
 * the same thing twice (resize looks stuck; a 3-key reorder moves only one slot).
 * Re-sorting is a no-op for recolor/resize (ord unchanged) and uses the SAME total
 * order as the fetch + subscription, so the optimistic order matches the server. */
function patchSticky(qc: QueryClient, room: string, id: string, patch: Partial<StickyRecord>) {
  const key = roomStickiesKey(room);
  const prev = qc.getQueryData<StickyRecord[]>(key);
  if (prev) {
    const next = sortStickies(prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    qc.setQueryData<StickyRecord[]>(key, next);
  }
  return () => qc.setQueryData<StickyRecord[]>(key, prev);
}

/**
 * "Arrange" mutations for a room's stickies — recolor, resize and reorder. Split out of
 * useStickyMutations to keep each hook small + single-purpose. All three apply
 * OPTIMISTICALLY (onMutate patches the cache, rolled back on error) so an action shows
 * instantly and a rapid follow-up computes from the updated value; each success
 * invalidates the room query as a belt-and-suspenders refresh. `count` keeps the recents
 * row accurate (these are metadata edits, so the count is unchanged).
 */
export function useStickyArrange(room: string, count: number) {
  const queryClient = useQueryClient();
  // Refetch as a belt-and-suspenders sync — but ONLY when this is the last arrange
  // mutation in flight. Invalidating after each write in a rapid sequence (e.g.
  // three quick keyboard-reorder presses) refetches the eventually-consistent
  // server mid-sequence, and an early write's stale snapshot clobbers the later
  // optimistic moves — the list bounces and can settle wrong. Deferring to the
  // last settle lets the optimistic order stand until the server has them all.
  const settle = () => {
    if (queryClient.isMutating() <= 1) {
      void queryClient.invalidateQueries({ queryKey: roomStickiesKey(room) });
    }
  };

  const recolor = useMutation({
    mutationFn: (vars: { id: string; color: string }) =>
      setStickyColor(vars.id, room, vars.color, count),
    onMutate: (vars) => ({
      rollback: patchSticky(queryClient, room, vars.id, { color: vars.color }),
    }),
    onSettled: settle,
    onError: (error, vars, ctx) => {
      ctx?.rollback();
      notifyWriteError(error, () => recolor.mutate(vars));
    },
  });

  const resize = useMutation({
    mutationFn: (vars: { id: string; size: string }) =>
      setStickySize(vars.id, room, vars.size, count),
    onMutate: (vars) => ({
      rollback: patchSticky(queryClient, room, vars.id, { size: vars.size }),
    }),
    onSettled: settle,
    onError: (error, vars, ctx) => {
      ctx?.rollback();
      notifyWriteError(error, () => resize.mutate(vars));
    },
  });

  const reorder = useMutation({
    mutationFn: (vars: { id: string; ord: number }) =>
      setStickyOrder(vars.id, room, vars.ord, count),
    onMutate: (vars) => ({ rollback: patchSticky(queryClient, room, vars.id, { ord: vars.ord }) }),
    onSettled: settle,
    onError: (error, vars, ctx) => {
      ctx?.rollback();
      notifyWriteError(error, () => reorder.mutate(vars));
    },
  });

  return { recolor, resize, reorder };
}
