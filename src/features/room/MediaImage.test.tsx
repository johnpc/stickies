import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaImage } from './MediaImage';

describe('MediaImage', () => {
  it('renders a lazy image with the filename as alt text', () => {
    render(<MediaImage url="https://s3/x.png" name="holiday.png" />);
    const img = screen.getByTestId('media-image');
    expect(img).toHaveAttribute('src', 'https://s3/x.png');
    expect(img).toHaveAttribute('alt', 'holiday.png');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('re-signs the URL once on the FIRST load error instead of showing broken', () => {
    // Regression: an expired signed URL (tab left open past ~15m, or a short guest
    // session) 403'd and stayed broken until the next 10-min background tick. Now
    // the first error triggers a re-sign; the placeholder is deferred.
    const onError = vi.fn();
    render(<MediaImage url="https://s3/expired.png" name="holiday.png" onError={onError} />);
    fireEvent.error(screen.getByTestId('media-image'));
    expect(onError).toHaveBeenCalledOnce();
    // Still showing the img (awaiting the re-signed url), NOT the broken placeholder.
    expect(screen.getByTestId('media-image')).toBeInTheDocument();
    expect(screen.queryByTestId('media-broken')).not.toBeInTheDocument();
  });

  it('shows the placeholder on a SECOND failure of the same url (no infinite retry)', () => {
    const onError = vi.fn();
    render(<MediaImage url="https://s3/expired.png" name="a.png" onError={onError} />);
    fireEvent.error(screen.getByTestId('media-image')); // 1st: re-sign
    fireEvent.error(screen.getByTestId('media-image')); // 2nd on same url: give up
    expect(onError).toHaveBeenCalledOnce(); // only one re-sign attempt spent
    expect(screen.getByTestId('media-broken')).toHaveTextContent('Couldn’t load a.png');
  });

  it('falls back to a labelled placeholder when the image fails with no re-sign handler', () => {
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
