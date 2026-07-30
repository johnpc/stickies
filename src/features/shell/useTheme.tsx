import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataThemeAttr, parseThemeMode, THEME_STORAGE_KEY, type ThemeMode } from './themeMode';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Apply a theme mode to <html> + persist it. Exported for direct use at
 * startup so first paint matches the saved choice (no flash). */
export function applyThemeMode(mode: ThemeMode): void {
  const attr = dataThemeAttr(mode);
  if (attr) document.documentElement.setAttribute('data-theme', attr);
  else document.documentElement.removeAttribute('data-theme');
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
