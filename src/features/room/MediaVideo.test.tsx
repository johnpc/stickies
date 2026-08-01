import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('re-signs the URL once on the first error, then shows broken on a repeat failure', () => {
    // Same expired-signed-URL recovery as MediaImage: one re-sign attempt, no loop.
    const onError = vi.fn();
    render(<MediaVideo url="https://s3/expired.mp4" name="clip.mp4" onError={onError} />);
    fireEvent.error(screen.getByTestId('media-video')); // 1st → re-sign
    expect(onError).toHaveBeenCalledOnce();
    expect(screen.getByTestId('media-video')).toBeInTheDocument(); // not broken yet
    fireEvent.error(screen.getByTestId('media-video')); // 2nd on same url → give up
    expect(onError).toHaveBeenCalledOnce();
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

  it('restores the playback position after a signed-URL refresh (no reset to 0)', () => {
    // Regression: the ~10-min re-sign gave the <video> a new src, reloading it to
    // 0:00 mid-watch. Track position/play-state and restore on the reload.
    const { rerender } = render(<MediaVideo url="https://s3/c.mp4?sig=1" name="c.mp4" />);
    const video = screen.getByTestId('media-video') as HTMLVideoElement;
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);

    // Simulate the user playing and reaching 0:37.
    fireEvent.play(video);
    video.currentTime = 37;
    fireEvent.timeUpdate(video);

    // The URL is re-signed (same object, new signature) → new src → reload to 0.
    rerender(<MediaVideo url="https://s3/c.mp4?sig=2" name="c.mp4" />);
    video.currentTime = 0; // the reload resets it...
    fireEvent.loadedMetadata(video); // ...and our handler puts it back.

    expect(video.currentTime).toBe(37);
    expect(playSpy).toHaveBeenCalled(); // it was playing → resume
  });
});
