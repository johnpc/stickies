/**
 * Preserve <video> playback across a signed-URL refresh. useMediaUrl re-signs the
 * S3 URL every ~10 min so a left-open sticky doesn't 403; but each re-sign is a
 * new URL string, which makes the browser reload the element and jump back to
 * 0:00 mid-watch. A media sticky's underlying object never changes (media isn't
 * editable — only the signature churns), so it's always safe to restore the
 * saved position + play-state once the new source is ready. Isolated + testable.
 */

/** Minimal surface of the parts of HTMLVideoElement we touch (so tests can mock). */
export interface Seekable {
  currentTime: number;
  play?: () => Promise<void> | void;
}

/**
 * Restore `pos` (seconds) and resume if `wasPlaying`, after a source reload.
 * Skips a fresh element (pos 0). Guards a not-yet-seekable element and a
 * rejected play() (autoplay policy) so restore is always best-effort.
 */
export function restorePlayback(video: Seekable | null, pos: number, wasPlaying: boolean): void {
  if (!video || pos <= 0) return;
  try {
    video.currentTime = pos;
  } catch {
    return; // not seekable yet — nothing more to do
  }
  if (wasPlaying) void Promise.resolve(video.play?.()).catch(() => {});
}
