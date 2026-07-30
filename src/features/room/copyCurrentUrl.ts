/** Copy the current page URL to the clipboard. Returns whether it succeeded so
 * the caller can decide whether to confirm. Isolated (touches navigator +
 * clipboard) so components stay pure and this can be stubbed in tests. */
export async function copyCurrentUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
