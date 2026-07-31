import { useEffect, useState } from 'react';

interface MediaImageProps {
  url: string;
  name: string;
  /** Lightbox variant renders a bare <img> (lightbox CSS targets the tag). */
  large?: boolean;
}

/** An uploaded IMAGE sticky's picture. If the object fails to load (deleted,
 * corrupt, or a signed URL that lapsed before refresh), fall back to a labelled
 * placeholder instead of the browser's broken-image glyph — mirrors how
 * LinkSticky handles a dead preview image. Lazy-loaded so a media-heavy pad
 * doesn't fetch every full image up front. */
export function MediaImage({ url, name, large }: MediaImageProps) {
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
    <img
      className={large ? undefined : 'media-sticky__image'}
      src={url}
      alt={name}
      loading="lazy"
      data-testid="media-image"
      onError={() => setFailed(true)}
    />
  );
}
