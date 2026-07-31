/** Max bytes to read from a DOC upload. Previews show only the first lines, so
 * there's no reason to pull a multi-MB log fully into memory on every viewer. */
export const DOC_TEXT_CAP_BYTES = 256 * 1024;

/**
 * Read a fetch Response as UTF-8 text, but stop after `cap` bytes — so a huge
 * uploaded file doesn't load entirely into memory just to preview its first
 * lines. Streams the body and cancels once the cap is hit; falls back to
 * `res.text()` if the body isn't a readable stream (e.g. jsdom). Pure-ish
 * (touches only the passed Response), so it's unit-testable.
 */
export async function readCappedText(res: Response, cap = DOC_TEXT_CAP_BYTES): Promise<string> {
  const body = res.body;
  if (!body || typeof body.getReader !== 'function') {
    const full = await res.text();
    // Cap by character as a fallback (bytes ≈ chars for ASCII-ish text).
    return full.length > cap ? full.slice(0, cap) : full;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const merged = new Uint8Array(Math.min(total, cap));
  let offset = 0;
  for (const chunk of chunks) {
    const room = merged.length - offset;
    if (room <= 0) break;
    merged.set(chunk.subarray(0, room), offset);
    offset += Math.min(chunk.byteLength, room);
  }
  return new TextDecoder('utf-8').decode(merged);
}
