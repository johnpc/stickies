import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { setStickyColor, setStickySize, setStickyOrder } from './stickyArrangeApi';
import { notifyWriteError } from './notifyWriteError';
import { roomStickiesKey } from './roomStickiesKey';
import type { StickyRecord } from '../../lib/dataClient';

/** Optimistically patch one sticky's field in the room cache; returns a rollback
 * to the prior list. Recolor/resize are direct-manipulation taps — showing the
 * change instantly (not after the AppSync round-trip) both feels right AND fixes
 * the resize S→M→L cycle: it reads the CURRENT size, so a second tap before the
 * write lands must see the optimistic new size or it recomputes from stale state
 * and writes the same value twice (the cycle appears stuck). */
function patchSticky(qc: QueryClient, room: string, id: string, patch: Partial<StickyRecord>) {
  const key = roomStickiesKey(room);
  const prev = qc.getQueryData<StickyRecord[]>(key);
  if (prev) {
    qc.setQueryData<StickyRecord[]>(
      key,
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }
  return () => qc.setQueryData<StickyRecord[]>(key, prev);
}

/**
 * "Arrange" mutations for a room's stickies — recolor, resize and reorder. Split out of
 * useStickyMutations to keep each hook small + single-purpose. Recolor + resize apply
 * OPTIMISTICALLY (onMutate patches the cache, rolled back on error) so a tap shows
 * instantly and rapid taps compute from the updated value; each success invalidates
 * the room query as a belt-and-suspenders refresh. `count` keeps the recents row
 * accurate (these are metadata edits, so the count is unchanged).
 */
export function useStickyArrange(room: string, count: number) {
  const queryClient = useQueryClient();
  const settle = () => queryClient.invalidateQueries({ queryKey: roomStickiesKey(room) });

  const recolor = useMutation({
    mutationFn: (vars: { id: string; color: string }) =>
      setStickyColor(vars.id, room, vars.color, count),
    onMutate: (vars) => ({
      rollback: patchSticky(queryClient, room, vars.id, { color: vars.color }),
    }),
    onSuccess: settle,
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
    onSuccess: settle,
    onError: (error, vars, ctx) => {
      ctx?.rollback();
      notifyWriteError(error, () => resize.mutate(vars));
    },
  });

  const reorder = useMutation({
    mutationFn: (vars: { id: string; ord: number }) =>
      setStickyOrder(vars.id, room, vars.ord, count),
    onSuccess: settle,
    onError: (error, vars) => notifyWriteError(error, () => reorder.mutate(vars)),
  });

  return { recolor, resize, reorder };
}
