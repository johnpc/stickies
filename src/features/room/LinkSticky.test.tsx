import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useLinkPreview } = vi.hoisted(() => ({ useLinkPreview: vi.fn() }));
vi.mock('./useLinkPreview', () => ({ useLinkPreview }));

import { LinkSticky } from './LinkSticky';

beforeEach(() => useLinkPreview.mockReturnValue({ preview: undefined, isLoading: false }));

describe('LinkSticky', () => {
  it('renders a plain safe link when there is no preview', () => {
    render(<LinkSticky url="example.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/');
    expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
  });

  it('renders a rich preview card when the resolver returns OG data', () => {
    useLinkPreview.mockReturnValue({
      preview: {
        title: 'Cool Page',
        description: 'desc',
        image: 'https://x/i.png',
        siteName: 'Example',
      },
      isLoading: false,
    });
    render(<LinkSticky url="https://example.com" />);
    const card = screen.getByTestId('link-preview');
    expect(card).toHaveAttribute('href', 'https://example.com/');
    expect(card).toHaveTextContent('Cool Page');
    expect(card).toHaveTextContent('Example');
    expect(card.querySelector('img')).toHaveAttribute('src', 'https://x/i.png');
  });

  it('never renders a javascript: URL as a live link', () => {
    render(<LinkSticky url="javascript:alert(1)" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });
});
