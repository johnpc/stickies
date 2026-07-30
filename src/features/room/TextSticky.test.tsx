import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { copyText } = vi.hoisted(() => ({ copyText: vi.fn().mockResolvedValue(true) }));
vi.mock('./copyText', () => ({ copyText }));

import { TextSticky } from './TextSticky';

beforeEach(() => copyText.mockClear());

describe('TextSticky', () => {
  it('renders the text with a copy button that copies it', () => {
    render(<TextSticky text="buy milk" />);
    expect(screen.getByText('buy milk')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('text-copy'));
    expect(copyText).toHaveBeenCalledWith('buy milk');
  });

  it('hides the copy button for blank text', () => {
    render(<TextSticky text="   " />);
    expect(screen.queryByTestId('text-copy')).not.toBeInTheDocument();
  });
});
