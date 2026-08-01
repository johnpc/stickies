/**
 * Read at most `max` bytes of a response body, streaming so a huge/hostile page
 * is NEVER fully buffered into Lambda memory. `res.text()` would download the
 * ENTIRE body first and only then slice — a fast server can stream hundreds of MB
 * within the abort window and OOM the function. Stop as soon as we have enough to
 * find the <head> meta tags (the preview never needs more). Falls back to
 * `res.text()` when the body isn't a readable stream. Decodes as UTF-8; a
 * multi-byte char split at the cap is dropped (stream decode), not mojibake'd.
 */
export async function readCappedHtml(res: Response, max: number): Promise<string> {
  const body = res.body;
  if (!body || typeof body.getReader !== 'function') {
    return (await res.text()).slice(0, max);
  }
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let html = '';
  let total = 0;
  try {
    while (total < max) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return html.slice(0, max);
}
