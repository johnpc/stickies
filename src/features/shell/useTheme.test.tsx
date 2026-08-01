import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyThemeMode, ThemeProvider, useTheme } from './useTheme';

function Probe() {
  const { mode, setMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button data-testid="to-dark" onClick={() => setMode('dark')} />
      <button data-testid="to-system" onClick={() => setMode('system')} />
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.querySelector('meta#theme-color-override')?.remove();
});
afterEach(() => {
  localStorage.clear();
  document.querySelector('meta#theme-color-override')?.remove();
});

const overrideColor = () =>
  document.querySelector('meta#theme-color-override')?.getAttribute('content') ?? null;

describe('applyThemeMode', () => {
  it('sets data-theme for explicit modes and clears it for system', () => {
    applyThemeMode('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyThemeMode('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('syncs the browser-chrome theme-color to an explicit choice, and removes it for system', () => {
    // Regression: the static index.html theme-color metas are keyed to
    // prefers-color-scheme, so an in-app override on a device whose OS scheme
    // differs left the chrome the wrong colour (Dark app + light OS → light bar).
    applyThemeMode('dark');
    expect(overrideColor()).toBe('#14130f'); // dark --sk-bg
    applyThemeMode('light');
    expect(overrideColor()).toBe('#f6f3ea'); // light --sk-bg
    applyThemeMode('system');
    expect(overrideColor()).toBeNull(); // removed → OS-driven media metas win
  });
});

describe('ThemeProvider / useTheme', () => {
  it('defaults to system and persists an explicit choice to <html> + storage', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('system');
    act(() => fireEvent.click(screen.getByTestId('to-dark')));
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem('stickies:theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    act(() => fireEvent.click(screen.getByTestId('to-system')));
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('reads the saved choice on mount', () => {
    localStorage.setItem('stickies:theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
  });
});
