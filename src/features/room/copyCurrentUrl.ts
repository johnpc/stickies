import { copyText } from './copyText';

/** Copy the current page URL to the clipboard. Returns whether it succeeded so
 * the caller can decide whether to confirm. Thin wrapper over copyText so the
 * clipboard access lives in one place. */
export async function copyCurrentUrl(): Promise<boolean> {
  return copyText(window.location.href);
}
