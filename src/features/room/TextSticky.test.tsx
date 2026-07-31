import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { copyText } = vi.hoisted(() => ({ copyText: vi.fn().mockResolvedValue(true) }));
vi.mock('./copyText', () => ({ copyText }));

import { TextSticky } from './TextSticky';
import { onToast } from '../shell/toastBus';

beforeEach(() => copyText.mockClear());

describe('TextSticky', () => {
  it('renders the text with a copy button that copies it and confirms', async () => {
    const toasts: string[] = [];
    const off = onToast((t) => toasts.push(t.message));
    render(<TextSticky text="buy milk" />);
    expect(screen.getByText('buy milk')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('text-copy'));
    expect(copyText).toHaveBeenCalledWith('buy milk');
    // The user gets a confirmation, not silence.
    await waitFor(() => expect(toasts).toContain('Copied to clipboard'));
    off();
  });

  it('hides the copy button for blank text', () => {
    render(<TextSticky text="   " />);
    expect(screen.queryByTestId('text-copy')).not.toBeInTheDocument();
  });

  it('renders a URL embedded in a note as a safe tappable link', () => {
    render(<TextSticky text="Standup: https://zoom.us/j/1 at 10am" />);
    const link = screen.getByRole('link', { name: 'https://zoom.us/j/1' });
    expect(link).toHaveAttribute('href', 'https://zoom.us/j/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    // Surrounding words are preserved as text.
    expect(screen.getByText(/Standup:/)).toBeInTheDocument();
    expect(screen.getByText(/at 10am/)).toBeInTheDocument();
  });

  it('does NOT render a javascript: URL in a note as a link (XSS guard)', () => {
    render(<TextSticky text="run javascript:alert(1) now" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/javascript:alert\(1\)/)).toBeInTheDocument();
  });
});
