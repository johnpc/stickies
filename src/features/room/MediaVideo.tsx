import { useEffect, useRef, useState } from 'react';
import { restorePlayback } from './videoPlayback';

interface MediaVideoProps {
  url: string;
  name: string;
  /** Lightbox variant renders a bare <video> (lightbox CSS targets the tag). */
  large?: boolean;
  /** Re-sign the S3 URL (useMediaUrl.refresh). Called ONCE on a load error before
   * giving up — recovers an expired signed URL on the spot. */
  onError?: () => void;
}

/** An uploaded VIDEO sticky's player. If the media fails to load (deleted,
 * corrupt, or an unsupported codec), fall back to a labelled placeholder instead
 * of an empty/broken player — mirrors MediaImage. playsInline keeps iOS from
 * hijacking playback into fullscreen; preload=metadata avoids eagerly fetching
 * every clip on a media-heavy pad.
 *
 * The signed URL is re-issued every ~10 min (useMediaUrl) so a left-open sticky
 * doesn't 403 — but a new src reloads the element to 0:00. We track the position
 * + play-state and restore them once the re-signed source loads, so playback
 * isn't interrupted mid-watch (the media object never changes, only the
 * signature). */
export function MediaVideo({ url, name, large, onError }: MediaVideoProps) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posRef = useRef(0);
  const playingRef = useRef(false);
  // Whether we've already spent our one re-sign attempt for the CURRENT url.
  const retried = useRef(false);
  // Re-arm if the sticky's underlying URL changes (e.g. signed-URL refresh): a new
  // url gets a fresh chance to load AND a fresh re-sign attempt.
  useEffect(() => {
    setFailed(false);
    retried.current = false;
  }, [url]);

  const handleError = () => {
    // First failure on this url: try a re-sign (likely expired) before giving up.
    if (!retried.current && onError) {
      retried.current = true;
      onError();
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <span className="sticky__text media-sticky__status" data-testid="media-broken">
        Couldn’t load {name}
      </span>
    );
  }

  return (
    <video
      ref={videoRef}
      className={large ? undefined : 'media-sticky__video'}
      src={url}
      controls
      playsInline
      preload="metadata"
      data-testid="media-video"
      onTimeUpdate={(e) => (posRef.current = e.currentTarget.currentTime)}
      onPlay={() => (playingRef.current = true)}
      onPause={() => (playingRef.current = false)}
      // Fires after the (re-signed) source loads — put playback back where it was
      // so a background URL refresh doesn't snap the video to the start.
      onLoadedMetadata={() => restorePlayback(videoRef.current, posRef.current, playingRef.current)}
      onError={handleError}
    >
      <track kind="captions" />
    </video>
  );
}
