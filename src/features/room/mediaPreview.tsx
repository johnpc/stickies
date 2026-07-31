import type { MediaKind } from './mediaKind';
import { MediaImage } from './MediaImage';
import { MediaVideo } from './MediaVideo';

/** The preview element for a media kind at a given URL. `large` swaps the small
 * list-view classes for lightbox sizing (the lightbox CSS targets bare tags).
 * IMAGE/VIDEO/PDF have visual previews; FILE/DOC have none (rendered elsewhere).
 * Kept as a pure factory so MediaSticky + the lightbox share one source. */
export function mediaPreview(kind: MediaKind, url: string, name: string, large = false) {
  if (kind === 'IMAGE') {
    return <MediaImage url={url} name={name} large={large} />;
  }
  if (kind === 'VIDEO') {
    return <MediaVideo url={url} name={name} large={large} />;
  }
  if (kind === 'PDF') {
    // iOS Safari + WKWebView (the published app's platform) won't render a PDF in
    // an <iframe> — it shows a blank box. Always pair the inline frame with an
    // "Open PDF" link that opens in a new tab (which DOES work on iOS), so the
    // PDF is never a dead end.
    const openLink = (
      <a
        className="media-sticky__pdf-open"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="media-pdf-fallback"
      >
        Open PDF ↗
      </a>
    );
    return large ? (
      <div className="media-sticky__pdf-wrap media-sticky__pdf-wrap--large">
        <iframe src={url} title={name} />
        {openLink}
      </div>
    ) : (
      <div className="media-sticky__pdf-wrap">
        <iframe className="media-sticky__pdf" src={url} title={name} data-testid="media-pdf" />
        {openLink}
      </div>
    );
  }
  return null;
}
