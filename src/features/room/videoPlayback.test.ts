import { describe, expect, it, vi } from 'vitest';
import { restorePlayback } from './videoPlayback';

describe('restorePlayback', () => {
  it('seeks back to the saved position after a source reload', () => {
    const video = { currentTime: 0, play: vi.fn() };
    restorePlayback(video, 42, false);
    expect(video.currentTime).toBe(42);
    expect(video.play).not.toHaveBeenCalled(); // was paused → stay paused
  });

  it('resumes playback when it was playing before the reload', () => {
    const video = { currentTime: 0, play: vi.fn().mockResolvedValue(undefined) };
    restorePlayback(video, 30, true);
    expect(video.currentTime).toBe(30);
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('does nothing for a fresh element (position 0) or a null element', () => {
    const video = { currentTime: 0, play: vi.fn() };
    restorePlayback(video, 0, true);
    expect(video.currentTime).toBe(0);
    expect(video.play).not.toHaveBeenCalled();
    expect(() => restorePlayback(null, 42, true)).not.toThrow();
  });

  it('is best-effort: a non-seekable element or a rejected play() does not throw', () => {
    const notSeekable = {
      set currentTime(_v: number) {
        throw new Error('not seekable');
      },
      get currentTime() {
        return 0;
      },
      play: vi.fn(),
    };
    expect(() => restorePlayback(notSeekable, 10, true)).not.toThrow();
    expect(notSeekable.play).not.toHaveBeenCalled(); // bailed before play

    const rejecting = { currentTime: 0, play: vi.fn().mockRejectedValue(new Error('autoplay')) };
    expect(() => restorePlayback(rejecting, 10, true)).not.toThrow();
  });
});
