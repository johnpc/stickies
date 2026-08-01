/**
 * The public, shareable URL for the current room. A share link has to open on
 * ANY device, so it must be the canonical web URL — https://stickies.jpc.io/<room>.
 *
 * `window.location.href` is wrong to share from the installed native app: with
 * the Capacitor defaults the app runs at `capacitor://localhost/<room>` (iOS) or
 * `http://localhost/<room>` (Android), so sharing `location.href` handed people a
 * `capacitor://localhost/…` link that opens nothing. We instead keep only the
 * PATH (the room is the only key) and graft it onto the canonical origin, so the
 * link is always a real https://stickies.jpc.io/<room> URL — the same one the
 * universal-link handler (useDeepLinks) routes back into the app.
 *
 * On the web this is a no-op (the origin already IS the canonical one, unless
 * you're on localhost/a preview — where pointing a shared link at prod is what
 * you want anyway). Pure over an injected href so it's fully unit-testable.
 */
export const CANONICAL_ORIGIN = 'https://stickies.jpc.io';

export function shareableRoomUrl(href: string = window.location.href): string {
  try {
    const { pathname, search, hash } = new URL(href);
    return `${CANONICAL_ORIGIN}${pathname}${search}${hash}`;
  } catch {
    // A malformed href (shouldn't happen for a live location) — fall back to the
    // canonical root rather than a broken/native link.
    return CANONICAL_ORIGIN;
  }
}
