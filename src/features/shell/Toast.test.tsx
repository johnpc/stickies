import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';
import { showToast } from './toastBus';

describe('Toast', () => {
  it('renders nothing until a message is published', () => {
    render(<Toast />);
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });

  it('shows a published message and dismisses on close', () => {
    render(<Toast />);
    act(() => showToast('saved'));
    expect(screen.getByTestId('app-toast')).toHaveTextContent('saved');
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });

  it('runs an action then dismisses', () => {
    const run = vi.fn();
    render(<Toast />);
    act(() => showToast('undo?', { label: 'Undo', run }));
    fireEvent.click(screen.getByTestId('app-toast-action'));
    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });

  describe('queueing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not let a later toast clobber an actionable Undo — it queues', () => {
      const undo = vi.fn();
      render(<Toast />);
      act(() => showToast('Sticky deleted', { label: 'Undo', run: undo }));
      // A follow-up plain toast arrives while Undo is still showing.
      act(() => showToast('Copied to clipboard'));
      // The Undo is still the visible toast (not replaced), so it stays usable.
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Sticky deleted');
      expect(screen.getByTestId('app-toast-action')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('app-toast-action'));
      expect(undo).toHaveBeenCalledOnce();
      // Dismissing the Undo advances to the queued message.
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Copied to clipboard');
    });

    it('auto-advances the queue after each toast times out', () => {
      render(<Toast />);
      act(() => showToast('first'));
      act(() => showToast('second'));
      expect(screen.getByTestId('app-toast')).toHaveTextContent('first');
      act(() => vi.advanceTimersByTime(6000));
      expect(screen.getByTestId('app-toast')).toHaveTextContent('second');
      act(() => vi.advanceTimersByTime(6000));
      expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
    });

    it('does NOT auto-expire an actionable toast — Undo stays available past 6s', () => {
      // Regression: every toast auto-advanced after 6s, so an "Undo" vanished on
      // its own. On a world-writable pad that made an accidental delete
      // permanently unrecoverable once the window lapsed.
      const undo = vi.fn();
      render(<Toast />);
      act(() => showToast('Sticky deleted', { label: 'Undo', run: undo }));
      // Well past the plain-toast timeout — the Undo must still be there.
      act(() => vi.advanceTimersByTime(30_000));
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Sticky deleted');
      expect(screen.getByTestId('app-toast-action')).toBeInTheDocument();
      // And it still works.
      fireEvent.click(screen.getByTestId('app-toast-action'));
      expect(undo).toHaveBeenCalledOnce();
      expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
    });

    it('holds a queued toast behind an actionable one until it is dismissed', () => {
      render(<Toast />);
      act(() => showToast('Sticky deleted', { label: 'Undo', run: vi.fn() }));
      act(() => showToast('Copied'));
      // Even well past 6s, the actionable toast holds; the plain one waits.
      act(() => vi.advanceTimersByTime(10_000));
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Sticky deleted');
      fireEvent.click(screen.getByLabelText('Dismiss'));
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Copied');
      // The plain one then expires normally.
      act(() => vi.advanceTimersByTime(6000));
      expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
    });
  });
});
