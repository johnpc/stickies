import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaImage } from './MediaImage';

describe('MediaImage', () => {
  it('renders a lazy image with the filename as alt text', () => {
    render(<MediaImage url="https://s3/x.png" name="holiday.png" />);
    const img = screen.getByTestId('media-image');
    expect(img).toHaveAttribute('src', 'https://s3/x.png');
    expect(img).toHaveAttribute('alt', 'holiday.png');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to a labelled placeholder when the image fails to load', () => {
    render(<MediaImage url="https://s3/dead.png" name="holiday.png" />);
    fireEvent.error(screen.getByTestId('media-image'));
    // No broken-image glyph — a readable message instead.
    expect(screen.queryByTestId('media-image')).not.toBeInTheDocument();
    expect(screen.getByTestId('media-broken')).toHaveTextContent('Couldn’t load holiday.png');
  });

  it('re-arms (shows the image again) when the url changes', () => {
    const { rerender } = render(<MediaImage url="https://s3/dead.png" name="a.png" />);
    fireEvent.error(screen.getByTestId('media-image'));
    expect(screen.getByTestId('media-broken')).toBeInTheDocument();
    // A refreshed signed URL should get a fresh chance to load.
    rerender(<MediaImage url="https://s3/fresh.png" name="a.png" />);
    expect(screen.getByTestId('media-image')).toHaveAttribute('src', 'https://s3/fresh.png');
  });

  it('renders a bare img (no list class) in the large/lightbox variant', () => {
    render(<MediaImage url="https://s3/x.png" name="a.png" large />);
    expect(screen.getByTestId('media-image')).not.toHaveClass('media-sticky__image');
  });
});
