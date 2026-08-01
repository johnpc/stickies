import { useQuery } from '@tanstack/react-query';
import { resolveMediaUrl } from './mediaApi';

/** How often to re-sign a media URL. S3 signs ours for ~15m; refresh well before
 * that so a sticky left open on a shared pad never rots into a broken 403. */
const REFRESH_MS = 10 * 60 * 1000;

/** Resolves a media sticky's S3 key to a signed URL for preview/download.
 * Cached by key. Signed URLs EXPIRE (~15m), and staleTime alone doesn't refetch
 * without a trigger (window focus is off app-wide) — so a pad left open would
 * show broken images after expiry. A background refetchInterval re-signs the URL
 * on a timer (and keeps running in the background) so the preview stays live. */
export function useMediaUrl(key: string) {
  const query = useQuery({
    queryKey: ['media-url', key],
    queryFn: () => resolveMediaUrl(key),
    enabled: !!key,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
  });
  return {
    url: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    // Force a re-sign now (bypasses staleTime) — used when a preview 403s off the
    // refresh cycle (tab suspended past expiry, or a short-lived guest session) so
    // it recovers on the spot instead of waiting for the next background tick.
    refresh: () => {
      void query.refetch();
    },
  };
}
