import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the amber accent's contrast. `--sk-accent-strong` is used BOTH as text
 * on the cream bg (the .sk-kicker heading + home links) and under white button
 * text, so it must clear WCAG AA 4.5:1 for normal text against BOTH. A prior value
 * (#9c6f08) was only 4.03:1 on cream — axe flagged the "Recently edited rooms"
 * heading. Asserting on the token so a future re-lightening can't silently regress
 * readability. Light-mode :root values only (dark mode is a lighter amber on a
 * dark bg, audited separately in-browser). */
const css = readFileSync(path.resolve(process.cwd(), 'src/theme/variables.css'), 'utf8');

/** Read a custom property from the FIRST (:root, light-mode) block. */
function token(name: string): string {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token ${name} not found`);
  return m[1];
}

/** Relative luminance of a #rrggbb color (WCAG formula). */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const chan = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

/** WCAG contrast ratio between two #rrggbb colors. */
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('accent contrast (light theme)', () => {
  const accentStrong = token('--sk-accent-strong');
  const bg = token('--sk-bg');
  const white = token('--sk-accent-contrast');

  it('accent-strong clears AA 4.5:1 as text on the cream background', () => {
    expect(contrast(accentStrong, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent-strong clears AA 4.5:1 under white button text', () => {
    expect(contrast(accentStrong, white)).toBeGreaterThanOrEqual(4.5);
  });
});
