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
  it('reads a small streamed body in full, not truncated', async () => {
    const res = streamResponse([bytes('line1\n'), bytes('line2\n')]);
    expect(await readCappedText(res)).toEqual({ text: 'line1\nline2\n', truncated: false });
  });

  it('stops at the byte cap and flags truncated (no full-file load)', async () => {
    // Three 100-byte chunks, cap at 150 → reads 200 (>cap) then stops → truncated.
    const chunk = bytes('x'.repeat(100));
    const res = streamResponse([chunk, chunk, chunk]);
    const out = await readCappedText(res, 150);
    expect(out.text.length).toBe(150);
    expect(out.truncated).toBe(true);
  });

  it('does not leave a mojibake � when the cap splits a multi-byte UTF-8 char', async () => {
    // Regression: decoding the capped bytes finalized the decoder, so a 2-byte
    // char (é = C3 A9) bisected by the cap rendered as a trailing �. Stream-decode
    // holds back the incomplete tail instead.
    const res = streamResponse([bytes('aaaaé')]); // 6 bytes; cap 5 splits é
    const out = await readCappedText(res, 5);
    expect(out.text).toBe('aaaa');
    expect(out.text).not.toContain('�');
    expect(out.truncated).toBe(true);
  });

  it('flags truncated when a chunk boundary lands EXACTLY on the cap but more data follows', async () => {
    // Regression: `while (total < cap)` exited when a chunk made total === cap, so
    // an over-cap file whose boundary hit the cap exactly was reported complete.
    const res = streamResponse([bytes('abcd'), bytes('efgh')]); // 8 bytes, cap 4
    const out = await readCappedText(res, 4);
    expect(out.text).toBe('abcd');
    expect(out.truncated).toBe(true);
  });

  it('keeps a complete multi-byte char at the end of an un-truncated file', async () => {
    const res = streamResponse([bytes('héllo')]); // 6 bytes, cap 100 → nothing dropped
    expect(await readCappedText(res, 100)).toEqual({ text: 'héllo', truncated: false });
  });

  it('trims a lone trailing surrogate in the no-stream fallback (astral split)', async () => {
    // 😀 is a surrogate pair; a char-slice at an odd boundary can keep just the high
    // half. Trim it so the fallback preview never ends in half an emoji (�).
    // 'ab😀cd' is 6 UTF-16 units: a b <hi> <lo> c d. cap 3 slices 'ab<hi>' → trim <hi>.
    const res = { body: null, text: () => Promise.resolve('ab😀cd') } as unknown as Response;
    const out = await readCappedText(res, 3);
    expect(out.text).toBe('ab');
    expect(out.text).not.toContain('�');
    expect(out.truncated).toBe(true);
  });

  it('falls back to res.text() (capped + flagged) when there is no stream body', async () => {
    const res = { body: null, text: () => Promise.resolve('a'.repeat(500)) } as unknown as Response;
    expect(await readCappedText(res, 100)).toEqual({ text: 'a'.repeat(100), truncated: true });
  });

  it('fallback is not truncated when the whole body fits', async () => {
    const res = { body: null, text: () => Promise.resolve('short') } as unknown as Response;
    expect(await readCappedText(res, 100)).toEqual({ text: 'short', truncated: false });
  });
});
