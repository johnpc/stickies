import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from './features/shell/themeMode';

/** Guards the no-flash theme bootstrap in index.html. The saved Light/Dark choice
 * must be applied to <html data-theme> by a BLOCKING inline <head> script, before
 * first paint — otherwise the CSS prefers-color-scheme media query paints the OS
 * scheme for a frame (a user who chose Light on a dark OS saw a dark flash). The
 * app's JS-bundle applyThemeMode runs too late to prevent that. */
const html = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

/** The inline (no-src) head scripts. */
const inlineScripts = [...doc.head.querySelectorAll('script')].filter(
  (s) => !s.getAttribute('src'),
);
const bootstrap = inlineScripts.find((s) => (s.textContent ?? '').includes(THEME_STORAGE_KEY));

describe('no-flash theme bootstrap (index.html)', () => {
  it('applies the saved theme from an inline <head> script (runs before paint)', () => {
    expect(bootstrap).toBeTruthy();
    // Inline + in <head> is what makes it blocking/pre-paint; a src= module would
    // load too late (that is exactly the flash this fixes).
    expect(bootstrap?.getAttribute('src')).toBeNull();
  });

  it('reads the same localStorage key the app persists the theme under', () => {
    const src = bootstrap?.textContent ?? '';
    expect(src).toContain(THEME_STORAGE_KEY);
    expect(src).toMatch(/localStorage/);
  });

  it('sets data-theme only for an explicit light/dark choice (System stays unset)', () => {
    const src = bootstrap?.textContent ?? '';
    // Mirrors dataThemeAttr: light/dark set the attribute; System/unknown leave it
    // off so prefers-color-scheme wins. Guard against a regression that would set
    // data-theme unconditionally (which would break System-follows-OS).
    expect(src).toContain('data-theme');
    expect(src).toMatch(/'light'|"light"/);
    expect(src).toMatch(/'dark'|"dark"/);
    expect(src).not.toMatch(/'system'|"system"/);
  });

  it('runs before the entry module so the attribute is set pre-paint', () => {
    // The blocking inline script must appear before the deferred/module bundle in
    // source order (head, before body's module script).
    const inlineIdx = html.indexOf(THEME_STORAGE_KEY);
    const moduleIdx = html.indexOf('src="/src/main.tsx"');
    expect(inlineIdx).toBeGreaterThan(-1);
    expect(moduleIdx).toBeGreaterThan(-1);
    expect(inlineIdx).toBeLessThan(moduleIdx);
  });
});
