import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaVideo } from './MediaVideo';

describe('MediaVideo', () => {
  it('renders a video with iOS-safe attributes', () => {
    render(<MediaVideo url="https://s3/c.mp4" name="clip.mp4" />);
    const video = screen.getByTestId('media-video');
    expect(video).toHaveAttribute('src', 'https://s3/c.mp4');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('falls back to a labelled placeholder when the video fails to load', () => {
    render(<MediaVideo url="https://s3/dead.mp4" name="clip.mp4" />);
    fireEvent.error(screen.getByTestId('media-video'));
    expect(screen.queryByTestId('media-video')).not.toBeInTheDocument();
    expect(screen.getByTestId('media-broken')).toHaveTextContent('Couldn’t load clip.mp4');
  });

  it('re-arms (shows the player again) when the url changes', () => {
    const { rerender } = render(<MediaVideo url="https://s3/dead.mp4" name="c.mp4" />);
    fireEvent.error(screen.getByTestId('media-video'));
    expect(screen.getByTestId('media-broken')).toBeInTheDocument();
    rerender(<MediaVideo url="https://s3/fresh.mp4" name="c.mp4" />);
    expect(screen.getByTestId('media-video')).toHaveAttribute('src', 'https://s3/fresh.mp4');
  });

  it('renders a bare video (no list class) in the large/lightbox variant', () => {
    render(<MediaVideo url="https://s3/c.mp4" name="c.mp4" large />);
    expect(screen.getByTestId('media-video')).not.toHaveClass('media-sticky__video');
  });
});
