import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the CODE panel background against a dark-mode contrast regression. The
 * highlight.js 'github' theme colors tokens for a WHITE page — its keyword
 * (#d73a49) only clears WCAG AA (4.57:1) on solid white. The panel used a
 * translucent rgba(255,255,255,.55), which composited to a muddy off-white in
 * light (keyword 4.14:1, under AA) and a dark gray over the dark surface in dark
 * mode (1.62:1, nearly illegible). The panel + gutter must be SOLID white so the
 * highlighted code stays readable in both themes. Asserting on the CSS text
 * (jsdom has no layout); the ratios are verified in-browser with axe-core. */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/codeSticky.css'), 'utf8');

function blockOf(selector: string): string {
  const escaped = selector.replace(/[.]/g, '\\$&');
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

describe('code panel contrast CSS', () => {
  /** The value of the `background:` declaration in a block (last one wins). */
  const bgValue = (selector: string): string => {
    const all = [...blockOf(selector).matchAll(/background:\s*([^;]+);/g)];
    return all.length ? all[all.length - 1][1].trim() : '';
  };

  it('gives the scroll panel a solid white background (not translucent / not a theme token)', () => {
    const bg = bgValue('.code-sticky__scroll');
    expect(bg).toMatch(/^#(?:fff|ffffff)$/i);
    // The translucent value muddied contrast; a theme token flips dark in dark mode.
    expect(bg).not.toMatch(/rgba/);
    expect(bg).not.toMatch(/var\(/);
  });

  it('gives the pinned gutter the same solid white (dark numbers need a light bg)', () => {
    const bg = bgValue('.code-sticky__gutter');
    expect(bg).toMatch(/^#(?:fff|ffffff)$/i);
    expect(bg).not.toMatch(/var\(/);
  });
});
