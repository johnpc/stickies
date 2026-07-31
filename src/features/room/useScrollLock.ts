import { useEffect } from 'react';

/**
 * Locks page scroll while a modal/overlay is open, restoring it on unmount.
 * This app is Ionic, so the scrollable surface is each `ion-content`'s own
 * container (NOT `document.body`) — a plain `body { overflow: hidden }` does
 * nothing, which is why an open Lightbox let the pad scroll behind it. We flip
 * every `ion-content`'s `scrollY` off (and set body overflow too, as a fallback
 * for non-Ionic mounts like tests), then restore the prior values on close.
 */
export function useScrollLock(): void {
  useEffect(() => {
    const contents = Array.from(document.querySelectorAll('ion-content'));
    const prevScrollY = contents.map((c) => (c as { scrollY?: boolean }).scrollY);
    contents.forEach((c) => {
      (c as { scrollY?: boolean }).scrollY = false;
    });
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      contents.forEach((c, i) => {
        (c as { scrollY?: boolean }).scrollY = prevScrollY[i] ?? true;
      });
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);
}
