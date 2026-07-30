import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from './useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeToggle', () => {
  it('marks the active mode and switches on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-system')).toHaveAttribute('aria-pressed', 'true');
    act(() => fireEvent.click(screen.getByTestId('theme-dark')));
    expect(screen.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('theme-system')).toHaveAttribute('aria-pressed', 'false');
  });
});
