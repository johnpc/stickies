import { useQuery } from '@tanstack/react-query';
import { fetchLinkPreview } from './linkPreviewApi';

/** Fetches a LINK sticky's OpenGraph preview via the server resolver. Cached by
 * URL and kept fresh for a day (previews rarely change). Never throws to the UI —
 * the resolver fails soft, and the component falls back to the plain link. */
export function useLinkPreview(url: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['link-preview', url],
    queryFn: () => fetchLinkPreview(url),
    enabled: enabled && !!url,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });
  return { preview: query.data, isLoading: query.isLoading };
}
