import { useEffect, useState } from 'react';
import { useLinkPreview } from './useLinkPreview';
import { hasPreview, type LinkPreview } from './linkPreviewApi';
import { safeHref } from './safeHref';
import './linkSticky.css';

/** Whether a preview still has something worth showing as a card once its image
 * is out of the picture (dead/blocked → hidden). Text-only previews still count. */
function hasCardText(p: LinkPreview): boolean {
  return !!(p.title || p.description || p.siteName);
}

/** A LINK sticky. Always renders the guarded link; when the server resolver
 * returns OpenGraph data it also shows a rich preview card (image + title +
 * description + site). safeHref keeps a hostile URL from becoming a live href.
 * A preview image that fails to load (dead/hotlink-blocked) is hidden rather
 * than left as a broken-image glyph — and if that empties the card, we fall
 * back to the plain link, honoring the "fails soft" promise. */
export function LinkSticky({ url }: { url: string }) {
  const href = safeHref(url);
  // Only http(s) links have an OG preview to scrape — skip it for mailto:/tel:.
  const isWeb = !!href && /^https?:/.test(href);
  // Scrape the NORMALIZED href, not the raw url: a scheme-less host ("github.com/x")
  // links fine (safeHref adds https://) but the resolver's `new URL(raw)` throws on
  // it, so the raw url silently yielded no card while a full-scheme paste of the
  // same destination did — an inconsistent, missing preview.
  const { preview } = useLinkPreview(href ?? url, isWeb);
  const [imgFailed, setImgFailed] = useState(false);
  // Re-arm the image if the sticky's URL changes (edited to a different link).
  useEffect(() => setImgFailed(false), [url]);

  if (!href) return <span className="sticky__text">{url}</span>;

  const showImg = hasPreview(preview) && !!preview.image && !imgFailed;
  if (hasPreview(preview) && (showImg || hasCardText(preview))) {
    return (
      <a
        className="link-preview"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-preview"
      >
        {showImg && (
          <img
            className="link-preview__img"
            src={preview.image ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
        <span className="link-preview__body">
          {preview.siteName && <span className="link-preview__site">{preview.siteName}</span>}
          {preview.title && <span className="link-preview__title">{preview.title}</span>}
          {preview.description && <span className="link-preview__desc">{preview.description}</span>}
        </span>
      </a>
    );
  }

  return (
    <a
      className="sticky__link sticky__link--block"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="link-plain"
    >
      {url}
    </a>
  );
}
