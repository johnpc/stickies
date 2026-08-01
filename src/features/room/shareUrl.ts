/**
 * Native share (Web Share API) for a room link. On mobile — the published
 * Capacitor app and mobile browsers/PWA — the OS share sheet (Messages, WhatsApp,
 * mail…) is how people actually send a link; the app only offered a QR panel.
 * This wraps navigator.share so the button can offer the sheet WHEN AVAILABLE and
 * fall back otherwise. Pure over an injected navigator so it's unit-testable.
 */

/** Minimal navigator surface we use (so tests don't need a real one). */
export interface ShareNavigator {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
}

/** Whether the native share sheet is available in this environment. */
export function canShare(nav: ShareNavigator = navigator): boolean {
  return typeof nav.share === 'function';
}

/**
 * Open the native share sheet for a room URL. Returns 'shared' on success,
 * 'cancelled' if the user dismissed the sheet (AbortError — not an error to
 * surface), 'unavailable' if the API isn't present, or 'failed' on any other
 * error (caller can fall back to copy). Never throws.
 */
export async function shareUrl(
  url: string,
  title = 'Stickies',
  nav: ShareNavigator = navigator,
): Promise<'shared' | 'cancelled' | 'unavailable' | 'failed'> {
  if (!canShare(nav)) return 'unavailable';
  try {
    await nav.share!({ title, text: 'Join this Stickies pad', url });
    return 'shared';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}
