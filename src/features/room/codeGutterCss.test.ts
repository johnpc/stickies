import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the code-sticky CSS against the line-number gutter scrolling off-screen.
 * A CODE snippet with a line wider than the card scrolls horizontally; if the
 * gutter is a plain flex child of the scrolling row it slides away with the code
 * (the numbers vanish — the one thing a gutter must not do). It must be pinned
 * (position: sticky; left: 0) with an OPAQUE background so scrolled code passes
 * UNDER it, and the row must be `width: max-content` or the sticky containing
 * block is only viewport-wide and `left: 0` still scrolls away. Asserting on the
 * CSS text because jsdom has no layout to measure (verified in a real browser). */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/codeSticky.css'), 'utf8');

/** The declarations inside a given class selector's block (".foo { … }"). */
function blockOf(source: string, selector: string): string {
  const escaped = selector.replace(/[.]/g, '\\$&');
  const m = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

describe('code-sticky gutter CSS', () => {
  it('pins the gutter to the left so line numbers stay visible on horizontal scroll', () => {
    const gutter = blockOf(css, '.code-sticky__gutter');
    expect(gutter).toMatch(/position:\s*sticky/);
    expect(gutter).toMatch(/left:\s*0/);
  });

  it('gives the pinned gutter an opaque background so scrolled code passes under it', () => {
    const gutter = blockOf(css, '.code-sticky__gutter');
    // A transparent gutter would show the scrolled code bleeding through the numbers.
    expect(gutter).toMatch(/background:\s*var\(--sk-surface\)/);
    expect(gutter).toMatch(/z-index:/);
  });

  it('sizes the code row to its full content so the sticky gutter has a scrollable containing block', () => {
    // Without width: max-content the flex row is only viewport-wide, so the
    // sticky gutter's `left: 0` still scrolls off — the exact failure mode fixed.
    const pre = blockOf(css, '.code-sticky__pre');
    expect(pre).toMatch(/width:\s*max-content/);
  });
});
