import { useEffect } from 'react';

/** The app's default tab title (matches index.html) — restored when a screen
 * that set its own title unmounts. */
export const DEFAULT_TITLE = 'Stickies — a shared sticky-note pad at any URL';

/**
 * Set `document.title` while a screen is mounted, restoring the previous title on
 * unmount. Lets each room's tab/bookmark/history entry be distinguishable — every
 * room otherwise showed the same static index.html title, so several open rooms
 * were indistinguishable in the tab strip.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
