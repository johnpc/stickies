import { useQuery } from '@tanstack/react-query';
import { resolveMediaUrl } from './mediaApi';

/** Resolves a media sticky's S3 key to a signed URL for preview/download.
 * Cached by key; signed URLs are short-lived so we let them refetch on staleness
 * rather than pinning forever. */
export function useMediaUrl(key: string) {
  const query = useQuery({
    queryKey: ['media-url', key],
    queryFn: () => resolveMediaUrl(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000, // signed URLs last ~15m; refetch well before expiry
  });
  return { url: query.data, isLoading: query.isLoading, isError: query.isError };
}
