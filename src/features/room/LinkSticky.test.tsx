import { render, screen, fireEvent } from '@testing-library/react';
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
    // The whole-card fallback link carries the block variant, so a very long URL
    // is height-capped + scrolls (like TEXT) instead of ballooning the card.
    expect(link).toHaveClass('sticky__link--block');
  });

  it('renders a bare email as a mailto link (not a broken https link)', () => {
    render(<LinkSticky url="alex@example.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'mailto:alex@example.com');
    expect(link).toHaveTextContent('alex@example.com');
    // No OG preview is fetched for a non-web scheme (enabled=false), and it's
    // asked about the normalized href, not the raw input.
    expect(useLinkPreview).toHaveBeenLastCalledWith('mailto:alex@example.com', false);
  });

  it('scrapes the NORMALIZED href for a scheme-less host so it still gets a preview', () => {
    // Regression: LinkSticky fetched with the RAW url. A bare host ("github.com/x")
    // links fine (safeHref adds https://) but the resolver's new URL(raw) threw on
    // the scheme-less string, so it silently got no card — while a full-scheme paste
    // of the same destination did. Fetch the href the anchor actually points to.
    render(<LinkSticky url="github.com/foo" />);
    expect(useLinkPreview).toHaveBeenLastCalledWith('https://github.com/foo', true);
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

  it('hides a preview image that fails to load but keeps the text card', () => {
    useLinkPreview.mockReturnValue({
      preview: {
        title: 'Cool Page',
        description: 'desc',
        image: 'https://x/dead.png',
        siteName: 'Example',
      },
      isLoading: false,
    });
    render(<LinkSticky url="https://example.com" />);
    const img = screen.getByTestId('link-preview').querySelector('img')!;
    fireEvent.error(img);
    // Image gone (no broken glyph), but the rich card with title/site survives.
    const card = screen.getByTestId('link-preview');
    expect(card.querySelector('img')).toBeNull();
    expect(card).toHaveTextContent('Cool Page');
  });

  it('falls back to the plain link when an image-only preview fails to load', () => {
    useLinkPreview.mockReturnValue({
      preview: { title: null, description: null, image: 'https://x/dead.png', siteName: null },
      isLoading: false,
    });
    render(<LinkSticky url="https://example.com" />);
    fireEvent.error(screen.getByTestId('link-preview').querySelector('img')!);
    // Nothing left worth carding → degrade to the plain safe link.
    expect(screen.queryByTestId('link-preview')).not.toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/');
    expect(link).toHaveTextContent('https://example.com');
  });

  it('never renders a javascript: URL as a live link', () => {
    render(<LinkSticky url="javascript:alert(1)" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });
});
