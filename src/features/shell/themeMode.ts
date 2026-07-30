/**
 * Theme-mode logic — pure helpers, no React or DOM, so they're unit-testable.
 * The user's choice is Light / Dark / System; System defers to the OS. We apply
 * the resolved scheme by setting (or clearing) [data-theme] on <html>, which the
 * token media query in variables.css keys off.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'stickies:theme';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

/** Coerce an unknown stored value into a valid ThemeMode (default 'system'). */
export function parseThemeMode(value: string | null | undefined): ThemeMode {
  return MODES.includes(value as ThemeMode) ? (value as ThemeMode) : 'system';
}

/**
 * The value to write to <html data-theme>: 'light'/'dark' for an explicit
 * choice, or null for System (let prefers-color-scheme win). Returning null
 * (rather than removing here) keeps this pure — the caller applies it.
 */
export function dataThemeAttr(mode: ThemeMode): 'light' | 'dark' | null {
  return mode === 'system' ? null : mode;
}
