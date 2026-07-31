import { describe, expect, it, vi } from 'vitest';
import { readCappedText } from './readCappedText';

/** A Response-like object backed by a ReadableStream of the given byte chunks. */
function streamResponse(chunks: Uint8Array[]): Response {
  let i = 0;
  const cancel = vi.fn().mockResolvedValue(undefined);
  return {
    body: {
      getReader: () => ({
        read: () =>
          i < chunks.length
            ? Promise.resolve({ done: false, value: chunks[i++] })
            : Promise.resolve({ done: true, value: undefined }),
        cancel,
      }),
    },
  } as unknown as Response;
}

const bytes = (s: string) => new TextEncoder().encode(s);

describe('readCappedText', () => {
  it('reads a small streamed body in full', async () => {
    const res = streamResponse([bytes('line1\n'), bytes('line2\n')]);
    expect(await readCappedText(res)).toBe('line1\nline2\n');
  });

  it('stops reading once the byte cap is reached (no full-file load)', async () => {
    // Three 100-byte chunks, cap at 150 → only ~150 bytes decoded, rest skipped.
    const chunk = bytes('x'.repeat(100));
    const res = streamResponse([chunk, chunk, chunk]);
    const out = await readCappedText(res, 150);
    expect(out.length).toBe(150);
  });

  it('falls back to res.text() (capped) when there is no readable stream body', async () => {
    const res = { body: null, text: () => Promise.resolve('a'.repeat(500)) } as unknown as Response;
    expect(await readCappedText(res, 100)).toBe('a'.repeat(100));
  });
});
