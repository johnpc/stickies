/**
 * Force-download a (possibly cross-origin) URL under a chosen filename.
 *
 * The HTML5 `download` attribute is IGNORED for cross-origin resources — and our
 * media URLs are signed S3 links on *.amazonaws.com — so a plain
 * `<a href download>` just OPENS the file inline in a new tab and loses the
 * filename. Instead we fetch the bytes and save them via a same-origin blob URL,
 * where `download` (and the original filename) IS honored. Falls back to opening
 * the URL in a new tab if the fetch fails (e.g. offline), so the button never
 * dead-ends. Returns whether a real download was triggered.
 */
export async function downloadFile(url: string, fileName: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke after the click has had a tick to start the save.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    return true;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
}
