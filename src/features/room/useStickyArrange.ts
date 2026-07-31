import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setStickyColor, setStickyOrder } from './stickyArrangeApi';
import { notifyWriteError } from './notifyWriteError';
import { roomStickiesKey } from './roomStickiesKey';

/**
 * "Arrange" mutations for a room's stickies — recolor and reorder. Split out of
 * useStickyMutations to keep each hook small + single-purpose. Like the others,
 * each success invalidates the room query so the pad refreshes even if the live
 * observeQuery subscription is momentarily slow. `count` keeps the recents row
 * accurate (these are metadata edits, so the count is unchanged).
 */
export function useStickyArrange(room: string, count: number) {
  const queryClient = useQueryClient();
  const settle = () => queryClient.invalidateQueries({ queryKey: roomStickiesKey(room) });

  const recolor = useMutation({
    mutationFn: (vars: { id: string; color: string }) =>
      setStickyColor(vars.id, room, vars.color, count),
    onSuccess: settle,
    onError: (error, vars) => notifyWriteError(error, () => recolor.mutate(vars)),
  });

  const reorder = useMutation({
    mutationFn: (vars: { id: string; ord: number }) =>
      setStickyOrder(vars.id, room, vars.ord, count),
    onSuccess: settle,
    onError: (error, vars) => notifyWriteError(error, () => reorder.mutate(vars)),
  });

  return { recolor, reorder };
}
