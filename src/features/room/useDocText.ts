import { useQuery } from '@tanstack/react-query';
import { resolveMediaUrl } from './mediaApi';

/** Fetch the text content of an uploaded DOC sticky: resolve its S3 path to a
 * signed URL, then fetch the body as text. Cached by path. Bounded read — a huge
 * upload still fetches fully, but DOC previews only render the first lines, so
 * the cost stays on the network, not the DOM. */
export function useDocText(path: string) {
  const query = useQuery({
    queryKey: ['doc-text', path],
    queryFn: async () => {
      const url = await resolveMediaUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      return res.text();
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000,
  });
  return { text: query.data, isLoading: query.isLoading, isError: query.isError };
}
