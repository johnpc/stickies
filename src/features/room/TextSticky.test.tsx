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
});
