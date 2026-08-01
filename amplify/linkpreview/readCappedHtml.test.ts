import { describe, expect, it } from 'vitest';
import { readCappedHtml } from './readCappedHtml';

/** A Response-like object backed by a ReadableStream of the given byte chunks. */
function streamResponse(chunks: Uint8Array[]): Response {
  let i = 0;
  return {
    body: {
      getReader: () => ({
        read: () =>
          i < chunks.length
            ? Promise.resolve({ done: false, value: chunks[i++] })
            : Promise.resolve({ done: true, value: undefined }),
        cancel: () => Promise.resolve(),
      }),
    },
  } as unknown as Response;
}
const bytes = (s: string) => new TextEncoder().encode(s);

describe('readCappedHtml', () => {
  it('reads a small streamed body in full', async () => {
    const res = streamResponse([bytes('<title>Hi</title>')]);
    expect(await readCappedHtml(res, 1000)).toBe('<title>Hi</title>');
  });

  it('stops at the cap on a huge/infinite stream (never buffers it all)', async () => {
    let pulled = 0;
    const chunk = bytes('x'.repeat(10_000));
    const res = {
      body: {
        getReader: () => ({
          read: () => {
            pulled += chunk.byteLength;
            return Promise.resolve({ done: false, value: chunk }); // never ends
          },
          cancel: () => Promise.resolve(),
        }),
      },
    } as unknown as Response;
    const out = await readCappedHtml(res, 20_000);
    expect(out.length).toBeLessThanOrEqual(20_000);
    expect(pulled).toBeLessThanOrEqual(40_000); // bounded, not unbounded
  });

  it('falls back to res.text() (capped) when there is no readable stream', async () => {
    const res = { body: null, text: () => Promise.resolve('a'.repeat(500)) } as unknown as Response;
    expect(await readCappedHtml(res, 100)).toBe('a'.repeat(100));
  });

  it('does not mojibake a multi-byte char split across the cap', async () => {
    // 'é' (C3 A9) straddling a chunk boundary — stream decode holds the partial
    // byte instead of emitting a replacement char.
    const res = streamResponse([bytes('aaaa').slice(0, 4), bytes('é')]);
    const out = await readCappedHtml(res, 1000);
    expect(out).toBe('aaaaé');
    expect(out).not.toContain('�');
  });
});
