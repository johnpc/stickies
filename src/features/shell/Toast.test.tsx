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

  describe('a11y', () => {
    it('moves focus to the action button of an actionable toast (reachable + announced)', () => {
      // Regression: the Undo button was unreachable (end of the DOM) and its
      // presence was never announced, so an accidental delete was unrecoverable
      // for keyboard/AT users. Focusing it makes it reachable and read out.
      render(<Toast />);
      act(() => showToast('Sticky deleted', { label: 'Undo', run: vi.fn() }));
      const action = screen.getByTestId('app-toast-action');
      expect(document.activeElement).toBe(action);
      // Assertive so AT surfaces it promptly.
      expect(screen.getByTestId('app-toast')).toHaveAttribute('role', 'alert');
    });

    it('restores focus to the prior element when the actionable toast closes', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();
      render(<Toast />);
      act(() => showToast('Sticky deleted', { label: 'Undo', run: vi.fn() }));
      expect(document.activeElement).toBe(screen.getByTestId('app-toast-action'));
      fireEvent.click(screen.getByTestId('app-toast-action')); // acts + dismisses
      expect(document.activeElement).toBe(opener); // focus handed back
      opener.remove();
    });

    it('a plain toast is a polite status and does NOT steal focus', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();
      render(<Toast />);
      act(() => showToast('Copied to clipboard'));
      expect(screen.getByTestId('app-toast')).toHaveAttribute('role', 'status');
      expect(document.activeElement).toBe(opener); // focus untouched
      opener.remove();
    });

    describe('with fake timers (queued restore)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.useRealTimers();
      });

      it('restores focus to the opener even when a PLAIN toast is queued behind the Undo', () => {
        // Regression: restore only fired on actionable→EMPTY. If any toast was
        // queued behind the Undo (trivially common — "Copied", a Retry, etc.), the
        // guard `&& !next` was false, so a keyboard/AT user who deleted a sticky was
        // stranded on <body> forever. Restore must survive a plain toast following.
        const opener = document.createElement('button');
        document.body.appendChild(opener);
        opener.focus();
        render(<Toast />);
        act(() => showToast('Sticky deleted', { label: 'Undo', run: vi.fn() }));
        act(() => showToast('Copied to clipboard')); // queued behind the Undo
        fireEvent.click(screen.getByLabelText('Dismiss')); // leave the Undo → plain shows
        // Focus is handed back as soon as we leave the actionable toast (the plain
        // one doesn't take focus), not only once the queue drains.
        expect(document.activeElement).toBe(opener);
        act(() => vi.advanceTimersByTime(6000)); // plain toast expires
        expect(document.activeElement).toBe(opener);
        opener.remove();
      });

      it('across a chain of actionable toasts, restores to the ORIGINAL opener (not a stale action button)', () => {
        const opener = document.createElement('button');
        document.body.appendChild(opener);
        opener.focus();
        render(<Toast />);
        act(() => showToast('Sticky deleted', { label: 'Undo', run: vi.fn() }));
        act(() => showToast('Write failed', { label: 'Retry', run: vi.fn() })); // 2nd actionable, queued
        // Leave the first actionable → the second (actionable) takes focus; the
        // original opener must still be the recorded return target, not the now-gone
        // first Undo button.
        fireEvent.click(screen.getByLabelText('Dismiss'));
        expect(screen.getByTestId('app-toast')).toHaveTextContent('Write failed');
        expect(document.activeElement).toBe(screen.getByTestId('app-toast-action'));
        fireEvent.click(screen.getByLabelText('Dismiss')); // leave the chain
        expect(document.activeElement).toBe(opener); // back to the real opener
        opener.remove();
      });
    });
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
