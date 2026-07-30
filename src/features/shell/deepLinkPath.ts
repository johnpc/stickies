/**
 * Turn an incoming universal/app-link URL into the in-app path to navigate to.
 * A shared link is the SAME https://stickies.jpc.io/<room> URL the web app uses,
 * so opening it in the installed app should land on that room. Pure over its
 * input (no Capacitor/router), so it's unit-testable.
 *
 * Returns the path ("/room-name" or "/") or null if the URL isn't parseable —
 * the caller then leaves the current view alone.
 */
export function deepLinkPath(url: string): string | null {
  try {
    const { pathname, search } = new URL(url);
    // Strip a trailing slash (but keep the root "/") so routing is consistent.
    const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    return `${path}${search}`;
  } catch {
    return null;
  }
}
