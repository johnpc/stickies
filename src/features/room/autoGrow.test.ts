import { describe, expect, it } from 'vitest';
import { autoGrow, EDITOR_MAX_HEIGHT } from './autoGrow';

/** A textarea stub with a settable style.height and a fake scrollHeight. */
function fakeTextarea(scrollHeight: number) {
  return { style: { height: '' }, scrollHeight } as unknown as HTMLTextAreaElement;
}

describe('autoGrow', () => {
  it('grows to fit content under the cap', () => {
    const el = fakeTextarea(180);
    autoGrow(el);
    expect(el.style.height).toBe('180px');
  });

  it('clamps at the max height (then the textarea scrolls)', () => {
    const el = fakeTextarea(900);
    autoGrow(el);
    expect(el.style.height).toBe(`${EDITOR_MAX_HEIGHT}px`);
  });

  it('resets to auto before measuring so it can SHRINK, not only grow', () => {
    // Track the sequence of height writes: must set 'auto' first, then the px.
    const writes: string[] = [];
    const el = {
      scrollHeight: 120,
      style: {
        set height(v: string) {
          writes.push(v);
        },
        get height() {
          return writes[writes.length - 1] ?? '';
        },
      },
    } as unknown as HTMLTextAreaElement;
    autoGrow(el);
    expect(writes[0]).toBe('auto');
    expect(writes[1]).toBe('120px');
  });

  it('is a no-op for a null ref', () => {
    expect(() => autoGrow(null)).not.toThrow();
  });
});
