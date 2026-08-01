import { useEffect, useRef, useState } from 'react';

interface MediaImageProps {
  url: string;
  name: string;
  /** Lightbox variant renders a bare <img> (lightbox CSS targets the tag). */
  large?: boolean;
  /** Re-sign the S3 URL (useMediaUrl.refresh). Called ONCE on a load error before
   * giving up — recovers an expired signed URL on the spot. */
  onError?: () => void;
}

/** An uploaded IMAGE sticky's picture. If the object fails to load, first try
 * re-signing the URL once (an expired 403 is the common cause when a tab is left
 * open past the ~15m signature life, or a short guest session lapses); only if
 * the fresh URL ALSO fails do we fall back to a labelled placeholder instead of
 * the browser's broken-image glyph. Without the re-sign, an expired preview stayed
 * broken until the next 10-min background tick. Lazy-loaded so a media-heavy pad
 * doesn't fetch every full image up front. */
export function MediaImage({ url, name, large, onError }: MediaImageProps) {
  const [failed, setFailed] = useState(false);
  // Whether we've already spent our one re-sign attempt for the CURRENT url.
  const retried = useRef(false);
  // Re-arm if the sticky's underlying URL changes (e.g. signed-URL refresh): a new
  // url gets a fresh chance to load AND a fresh re-sign attempt.
  useEffect(() => {
    setFailed(false);
    retried.current = false;
  }, [url]);

  const handleError = () => {
    // First failure on this url: try a re-sign (likely expired) rather than
    // immediately showing broken. The refreshed url arrives via props → the effect
    // above re-arms us. If it fails AGAIN, fall through to the placeholder.
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
    <img
      className={large ? undefined : 'media-sticky__image'}
      src={url}
      alt={name}
      loading="lazy"
      data-testid="media-image"
      onError={handleError}
    />
  );
}
