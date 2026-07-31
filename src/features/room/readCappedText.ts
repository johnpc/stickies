/** Max bytes to read from a DOC upload. Previews show only the first lines, so
 * there's no reason to pull a multi-MB log fully into memory on every viewer. */
export const DOC_TEXT_CAP_BYTES = 256 * 1024;

/** A capped read: the text (≤ cap bytes) plus whether the file was longer than
 * the cap — so the UI can say "preview truncated — download for the full file"
 * instead of silently showing a cut-off document as if it were complete. */
export interface CappedText {
  text: string;
  truncated: boolean;
}

/**
 * Read a fetch Response as UTF-8 text, but stop after `cap` bytes — so a huge
 * uploaded file doesn't load entirely into memory just to preview its first
 * lines. Streams the body and cancels once the cap is hit; falls back to
 * `res.text()` if the body isn't a readable stream (e.g. jsdom). Reports whether
 * the source exceeded `cap`. Pure-ish (touches only the passed Response).
 */
export async function readCappedText(res: Response, cap = DOC_TEXT_CAP_BYTES): Promise<CappedText> {
  const body = res.body;
  if (!body || typeof body.getReader !== 'function') {
    const full = await res.text();
    // Cap by character as a fallback (bytes ≈ chars for ASCII-ish text).
    return full.length > cap
      ? { text: full.slice(0, cap), truncated: true }
      : { text: full, truncated: false };
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
  // Loop stopped because we hit the cap (not `done`) → the file has more.
  const truncated = total > cap;
  await reader.cancel().catch(() => {});
  const merged = new Uint8Array(Math.min(total, cap));
  let offset = 0;
  for (const chunk of chunks) {
    const room = merged.length - offset;
    if (room <= 0) break;
    merged.set(chunk.subarray(0, room), offset);
    offset += Math.min(chunk.byteLength, room);
  }
  return { text: new TextDecoder('utf-8').decode(merged), truncated };
}
