import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards the DOC filename's color. `.doc-sticky__name` sits on the sticky's
 * PASTEL note background, so it must use the note ink (which every pastel is tuned
 * to clear AA against, 11:1+) — NOT --sk-text-muted, which is tuned for the app
 * background and failed on the pastels (3.98:1 light / 1.89:1 dark — the filename
 * was nearly invisible on a blue note in dark mode). Asserting on the CSS text;
 * the ratios are verified in-browser with axe-core (0 violations light + dark). */
const css = readFileSync(path.resolve(process.cwd(), 'src/features/room/mediaSticky.css'), 'utf8');

function blockOf(selector: string): string {
  const escaped = selector.replace(/[.]/g, '\\$&');
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

describe('doc filename contrast', () => {
  it('colors the filename with the note ink (readable on any pastel), not the app-bg muted token', () => {
    const block = blockOf('.doc-sticky__name');
    const color = block.match(/(?<!-)color:\s*([^;]+);/)?.[1].trim() ?? '';
    expect(color).toBe('var(--sk-note-ink)');
    // Must NOT fall back to the app-background muted token that failed on pastels.
    expect(color).not.toMatch(/--sk-text-muted/);
  });
});
