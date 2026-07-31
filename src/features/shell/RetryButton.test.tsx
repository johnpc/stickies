import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RetryButton } from './RetryButton';

/** A controllable promise so a test can hold the retry "in flight". */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe('RetryButton', () => {
  it('calls onRetry and shows an immediate busy state on click', () => {
    const onRetry = vi.fn(() => new Promise(() => {})); // stays in flight
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

  it('ignores repeat clicks while a retry is in flight (no double refetch)', () => {
    const onRetry = vi.fn(() => new Promise(() => {})); // never settles
    render(<RetryButton onRetry={onRetry} />);
    const btn = screen.getByTestId('load-retry');
    fireEvent.click(btn);
    fireEvent.click(btn); // disabled now — should not fire again
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('re-enables after the retry settles, even on a REPEAT failure (no permanent lock)', async () => {
    // Regression: busy was only cleared by unmount, so a still-failing query kept
    // this same button mounted and stuck on "Retrying…" forever (only a reload
    // escaped). onRetry (react-query refetch) resolves when the attempt ends
    // regardless of outcome, so busy must clear off it.
    const d = deferred();
    const onRetry = vi.fn(() => d.promise);
    render(<RetryButton onRetry={onRetry} />);
    const btn = screen.getByTestId('load-retry');

    fireEvent.click(btn);
    expect(btn).toBeDisabled();

    // The retry finishes but the query is STILL errored (button stays mounted).
    d.resolve();
    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(btn).toHaveTextContent('Try again');

    // …and it's clickable again — a real second attempt fires.
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
