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
});
afterEach(() => localStorage.clear());

describe('applyThemeMode', () => {
  it('sets data-theme for explicit modes and clears it for system', () => {
    applyThemeMode('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyThemeMode('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
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
