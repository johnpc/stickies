import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RetryButton } from './RetryButton';

describe('RetryButton', () => {
  it('calls onRetry and shows an immediate busy state on click', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    const btn = screen.getByTestId('load-retry');
    expect(btn).toHaveTextContent('Try again');
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    // The refetch is in flight — give the user feedback instead of a frozen screen.
    expect(onRetry).toHaveBeenCalledOnce();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent(/retrying/i);
    expect(screen.getByTestId('load-retry-spinner')).toBeInTheDocument();
  });

  it('ignores repeat clicks while busy (no double refetch)', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    const btn = screen.getByTestId('load-retry');
    fireEvent.click(btn);
    fireEvent.click(btn); // disabled now — should not fire again
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
