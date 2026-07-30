/** Calls the guest-callable linkPreview query (server-side OG scrape). Returns
 * the preview fields; the resolver fails soft (all-null) for bad/blocked URLs. */
import { dataClient, unwrap } from '../../lib/dataClient';

export interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const result = unwrap(await dataClient.queries.linkPreview({ url }));
  return {
    title: result?.title ?? null,
    description: result?.description ?? null,
    image: result?.image ?? null,
    siteName: result?.siteName ?? null,
  };
}

/** True when a preview has at least a title or image worth rendering as a card. */
export function hasPreview(p: LinkPreview | undefined): p is LinkPreview {
  return !!p && (!!p.title || !!p.image);
}
