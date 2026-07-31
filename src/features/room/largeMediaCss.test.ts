import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards that a Large sticky raises the height cap on EVERY body kind. A Large
 * card is a 2×2 tile, but each body has a small-tile cap (media 220px, text/code
 * 320px); without a Large override the body stayed capped while the card grew,
 * wasting the bottom half — defeating "make it prominent". jsdom has no layout,
 * so assert on the CSS rule text. */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/sticky.css'), 'utf8');

/** The max-height (px) declared for `selectors` under `.sticky--size-L`, or 0. */
function largeMaxHeight(selectors: string): number {
  const escaped = selectors.replace(/[.]/g, '\\$&').replace(/,\s*/g, ',\\s*');
  const rule = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return rule ? Number(rule[1].match(/max-height:\s*(\d+)px/)?.[1] ?? 0) : 0;
}

describe('Large sticky body sizing (sticky.css)', () => {
  it('raises the image/video max-height for a Large sticky (was 220px)', () => {
    expect(
      largeMaxHeight('.sticky--size-L .media-sticky__image, .sticky--size-L .media-sticky__video'),
    ).toBeGreaterThan(220);
  });

  it('raises the text and code body max-height for a Large sticky (was 320px)', () => {
    expect(
      largeMaxHeight('.sticky--size-L .sticky__text, .sticky--size-L .code-sticky__scroll'),
    ).toBeGreaterThan(320);
  });
});
