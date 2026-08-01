import { useCallback } from 'react';
import { shareUrl } from './shareUrl';
import { copyText } from './copyText';
import { showToast } from '../shell/toastBus';

/**
 * Open the native share sheet for a room link, with graceful fallback. Mirrors
 * useCopyAction: the panel calls this and ignores the result; the toast/feedback
 * is centralized here. A user-cancelled sheet is silent (not an error); if the
 * sheet errors, fall back to copying the link so the action still does something.
 */
export function useShareAction(): (url: string) => Promise<void> {
  return useCallback(async (url: string) => {
    const result = await shareUrl(url);
    if (result === 'failed' || result === 'unavailable') {
      const ok = await copyText(url);
      showToast(ok ? 'Link copied to clipboard' : 'Couldn’t share — copy the link manually.');
    }
  }, []);
}
