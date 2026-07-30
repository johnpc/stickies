import { useQuery } from '@tanstack/react-query';
import { listRecentRooms } from './recentsApi';

/** The home page's "recently edited rooms" feed. Exposes isLoading/isError/
 * refetch so the screen can render a retryable LoadState (never a dead spinner). */
export function useRecentRooms(limit = 10) {
  const query = useQuery({
    queryKey: ['recent-rooms', limit],
    queryFn: () => listRecentRooms(limit),
  });
  return {
    rooms: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
