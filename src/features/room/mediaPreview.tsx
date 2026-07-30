import type { MediaKind } from './mediaKind';

/** The preview element for a media kind at a given URL. `large` swaps the small
 * list-view classes for lightbox sizing (the lightbox CSS targets bare tags).
 * IMAGE/VIDEO/PDF have visual previews; FILE/DOC have none (rendered elsewhere).
 * Kept as a pure factory so MediaSticky + the lightbox share one source. */
export function mediaPreview(kind: MediaKind, url: string, name: string, large = false) {
  if (kind === 'IMAGE') {
    return large ? (
      <img src={url} alt={name} />
    ) : (
      <img className="media-sticky__image" src={url} alt={name} data-testid="media-image" />
    );
  }
  if (kind === 'VIDEO') {
    return large ? (
      <video src={url} controls>
        <track kind="captions" />
      </video>
    ) : (
      <video className="media-sticky__video" src={url} controls data-testid="media-video">
        <track kind="captions" />
      </video>
    );
  }
  if (kind === 'PDF') {
    return large ? (
      <iframe src={url} title={name} />
    ) : (
      <iframe className="media-sticky__pdf" src={url} title={name} data-testid="media-pdf" />
    );
  }
  return null;
}
