import { useCallback } from 'react';
import { shareUrl } from './shareUrl';
import { copyText } from './copyText';
import { readableUrl } from './readableUrl';
import { showToast } from '../shell/toastBus';

/**
 * Open the native share sheet for a room link, with graceful fallback. Mirrors
 * useCopyAction: the panel calls this and ignores the result; the toast/feedback
 * is centralized here. A user-cancelled sheet is silent (not an error); if the
 * sheet errors, fall back to copying the link so the action still does something.
 *
 * The native share sends the RAW canonical url (what the OS / recipients resolve),
 * but the copy FALLBACK copies the human-readable decoded form — matching the
 * panel's Copy button so a unicode room isn't pasted as a wall of %XX from one
 * path and readable from the other.
 */
export function useShareAction(): (url: string) => Promise<void> {
  return useCallback(async (url: string) => {
    const result = await shareUrl(url);
    if (result === 'failed' || result === 'unavailable') {
      const ok = await copyText(readableUrl(url));
      showToast(ok ? 'Link copied to clipboard' : 'Couldn’t share — copy the link manually.');
    }
  }, []);
}
