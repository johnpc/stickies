import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dataClient, type StickyRecord } from '../../lib/dataClient';
import { listStickiesByRoom } from './stickiesApi';
import { sortStickies } from './sortStickies';
import { roomStickiesKey } from './roomStickiesKey';
import { subscribeWithRetry } from './subscribeWithRetry';

/**
 * A room's stickies, kept LIVE. Seeds from a one-shot fetch (so isLoading/isError
 * drive LoadState), then an Amplify observeQuery subscription streams every
 * create/edit/delete — from this device OR anyone else on the same URL — straight
 * into the react-query cache. That real-time sync is the whole point of a shared
 * pad. The subscription is scoped to this room via the `room` filter.
 */
export function useRoomStickies(room: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: roomStickiesKey(room),
    queryFn: () => listStickiesByRoom(room),
    enabled: !!room,
  });

  useEffect(() => {
    if (!room) return;
    // Self-healing subscription: if the AppSync stream dies (network flap, token
    // expiry, mobile backgrounding) it re-subscribes, so live sync doesn't stall
    // silently. A fresh observeQuery re-delivers the current snapshot on reconnect.
    return subscribeWithRetry<{ items: StickyRecord[] }>(
      () => dataClient.models.Sticky.observeQuery({ filter: { room: { eq: room } } }),
      ({ items }) => {
        queryClient.setQueryData<StickyRecord[]>(roomStickiesKey(room), sortStickies(items));
      },
    );
  }, [room, queryClient]);

  return {
    stickies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
