import { useLinkPreview } from './useLinkPreview';
import { hasPreview } from './linkPreviewApi';
import { safeHref } from './safeHref';
import './linkSticky.css';

/** A LINK sticky. Always renders the guarded link; when the server resolver
 * returns OpenGraph data it also shows a rich preview card (image + title +
 * description + site). safeHref keeps a hostile URL from becoming a live href. */
export function LinkSticky({ url }: { url: string }) {
  const href = safeHref(url);
  const { preview } = useLinkPreview(url, !!href);

  if (!href) return <span className="sticky__text">{url}</span>;

  if (hasPreview(preview)) {
    return (
      <a
        className="link-preview"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-preview"
      >
        {preview.image && (
          <img className="link-preview__img" src={preview.image} alt="" loading="lazy" />
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
    <a className="sticky__link" href={href} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  );
}
