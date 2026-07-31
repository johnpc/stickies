import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards that a Large media sticky raises its image/video height cap. Without
 * it, resizing an image/video to Large grew the 2×2 card but left the media
 * pinned at the small-tile 220px cap, wasting the bottom half — defeating the
 * "make it prominent" purpose for media. jsdom has no layout, so assert on the
 * CSS rule text. */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/sticky.css'), 'utf8');

describe('Large media sizing (sticky.css)', () => {
  it('raises the image/video max-height for a Large sticky', () => {
    // The rule scoping the media cap to a Large card.
    const rule = css.match(
      /\.sticky--size-L \.media-sticky__image,\s*\.sticky--size-L \.media-sticky__video\s*\{([^}]*)\}/,
    );
    expect(rule).not.toBeNull();
    const decls = rule![1];
    // Must be taller than the base 220px small-tile cap.
    const maxH = Number(decls.match(/max-height:\s*(\d+)px/)?.[1]);
    expect(maxH).toBeGreaterThan(220);
  });
});
