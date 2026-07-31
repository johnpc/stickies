import { useQuery } from '@tanstack/react-query';
import { resolveMediaUrl } from './mediaApi';
import { withTimeout } from '../../lib/withTimeout';
import { readCappedText } from './readCappedText';

/** Fetch the text content of an uploaded DOC sticky: resolve its S3 path to a
 * signed URL, then fetch the body as text. Cached by path. The fetch is bounded
 * two ways so a doc sticky can't hang or blow up memory: `withTimeout` turns a
 * stalled S3 request into an error state (was: stuck on "Loading…" forever), and
 * `readCappedText` reads at most ~256KB — DOC previews only show the first lines,
 * so pulling a multi-MB log fully into memory on every viewer was pure waste. */
export function useDocText(path: string) {
  const query = useQuery({
    queryKey: ['doc-text', path],
    queryFn: async () => {
      const url = await resolveMediaUrl(path);
      const res = await withTimeout(fetch(url), 15_000);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      return readCappedText(res);
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return {
    text: query.data?.text,
    // True when the file exceeded the read cap, so the preview is only a prefix.
    truncated: query.data?.truncated ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
