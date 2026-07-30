/** Copy arbitrary text to the clipboard. Returns whether it succeeded. Isolated
 * (touches navigator.clipboard) so components stay pure and it can be stubbed. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
