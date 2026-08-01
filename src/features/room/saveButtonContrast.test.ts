import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the editor Save button's text color. `.sticky__save` has a FIXED dark
 * `--sk-note-ink` background in both themes, so its text must be a FIXED light
 * color. It used `--sk-surface`, which is white in light mode but near-black
 * (#201e18) in DARK mode — rendering the label dark-on-dark at 1.02:1 (invisible).
 * `--sk-accent-contrast` is #ffffff in both themes (16:1 on the ink). Asserting on
 * the CSS text; the ratio is verified in-browser with axe-core (0 violations). */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/sticky.css'), 'utf8');

function blockOf(selector: string): string {
  const escaped = selector.replace(/[.]/g, '\\$&');
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

describe('editor Save button contrast', () => {
  it('uses a fixed light text color on the dark-ink button, not the theme-flipping surface token', () => {
    const block = blockOf('.sticky__save');
    const color = block.match(/(?<!-)color:\s*([^;]+);/)?.[1].trim() ?? '';
    expect(color).toBe('var(--sk-accent-contrast)');
    // --sk-surface goes dark in dark mode → dark-on-dark. Must not be used here.
    expect(color).not.toMatch(/--sk-surface/);
  });
});
