import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): ReactElement {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary onReload={vi.fn()}>
        <div data-testid="ok">fine</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('shows the fallback and reloads on click when a child throws', () => {
    const onReload = vi.fn();
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-reload'));
    expect(onReload).toHaveBeenCalledOnce();
  });
});
