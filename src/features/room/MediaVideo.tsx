import { useEffect, useState } from 'react';

interface MediaVideoProps {
  url: string;
  name: string;
  /** Lightbox variant renders a bare <video> (lightbox CSS targets the tag). */
  large?: boolean;
}

/** An uploaded VIDEO sticky's player. If the media fails to load (deleted,
 * corrupt, or an unsupported codec), fall back to a labelled placeholder instead
 * of an empty/broken player — mirrors MediaImage. playsInline keeps iOS from
 * hijacking playback into fullscreen; preload=metadata avoids eagerly fetching
 * every clip on a media-heavy pad. */
export function MediaVideo({ url, name, large }: MediaVideoProps) {
  const [failed, setFailed] = useState(false);
  // Re-arm if the sticky's underlying URL changes (e.g. signed-URL refresh).
  useEffect(() => setFailed(false), [url]);

  if (failed) {
    return (
      <span className="sticky__text media-sticky__status" data-testid="media-broken">
        Couldn’t load {name}
      </span>
    );
  }

  return (
    <video
      className={large ? undefined : 'media-sticky__video'}
      src={url}
      controls
      playsInline
      preload="metadata"
      data-testid="media-video"
      onError={() => setFailed(true)}
    >
      <track kind="captions" />
    </video>
  );
}
