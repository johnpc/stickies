import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the link-preview CSS against a layout-shift regression. The preview
 * image loads async, so its slot MUST be a fixed height — otherwise the card
 * grows 0 → 120px on load and reflows every card below it in the grid. A prior
 * `max-height` (no reserved height) caused exactly that. Asserting on the CSS
 * text because jsdom has no layout to measure. */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/linkSticky.css'), 'utf8');

/** The declarations inside a given class selector's block (e.g. ".foo { … }"). */
function block(selector: string): string {
  const escaped = selector.replace(/[.]/g, '\\$&');
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

describe('link-preview CSS layout', () => {
  it('reserves the image slot with a fixed height (no 0→120 shift on load)', () => {
    const img = block('.link-preview__img');
    expect(img).toMatch(/height:\s*120px/);
    // A bare max-height would NOT reserve the box — the regression we fixed.
    expect(img).not.toMatch(/max-height:/);
  });

  it('wraps an over-long site name so an attacker-controlled og:site_name cannot widen the card', () => {
    expect(block('.link-preview__site')).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
