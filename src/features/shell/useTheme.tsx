import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataThemeAttr, parseThemeMode, THEME_STORAGE_KEY, type ThemeMode } from './themeMode';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// App background per explicit theme (mirrors --sk-bg in theme/variables.css). The
// browser-chrome theme-color must track the in-app override, not just the OS.
const BG_FOR: Record<'light' | 'dark', string> = { light: '#f6f3ea', dark: '#14130f' };

/** Keep the browser chrome (mobile address/status bar) in sync with an EXPLICIT
 * Light/Dark choice. The static index.html theme-color metas are keyed to
 * prefers-color-scheme, so an in-app override on a device whose OS scheme differs
 * left the chrome the wrong colour (e.g. Dark app + light OS → light status bar).
 * A non-media <meta name="theme-color"> takes precedence over the media ones; for
 * System we REMOVE it so the OS-driven media metas win again. */
function applyThemeColor(mode: ThemeMode): void {
  const id = 'theme-color-override';
  const existing = document.head.querySelector<HTMLMetaElement>(`meta#${id}`);
  const attr = dataThemeAttr(mode);
  if (!attr) {
    existing?.remove();
    return;
  }
  const meta = existing ?? document.createElement('meta');
  meta.id = id;
  meta.name = 'theme-color';
  meta.content = BG_FOR[attr];
  if (!existing) document.head.appendChild(meta);
}

/** Apply a theme mode to <html> + persist it. Exported for direct use at
 * startup so first paint matches the saved choice (no flash). */
export function applyThemeMode(mode: ThemeMode): void {
  const attr = dataThemeAttr(mode);
  if (attr) document.documentElement.setAttribute('data-theme', attr);
  else document.documentElement.removeAttribute('data-theme');
  applyThemeColor(mode);
}

/** Provides the current theme mode + a setter. Reads the saved choice once and
 * keeps <html data-theme> in sync so light/dark follows either the OS (System)
 * or the explicit override. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    parseThemeMode(localStorage.getItem(THEME_STORAGE_KEY)),
  );

  useEffect(() => applyThemeMode(mode), [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
  }, []);

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>;
}

/** Access the theme mode + setter. Throws if used outside ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
