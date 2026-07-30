import { IonIcon } from '@ionic/react';
import { documentOutline, downloadOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { mediaKind } from './mediaKind';
import { useMediaUrl } from './useMediaUrl';
import './mediaSticky.css';

/** Renders a media sticky's body from its S3 key: an inline preview for
 * image/PDF/video, or a generic download card for opaque files. The URL is
 * resolved (signed) via useMediaUrl; kind is re-derived defensively from the
 * stored mimeType/fileName so a bad `kind` still renders sensibly. */
export function MediaSticky({ sticky }: { sticky: StickyRecord }) {
  const { url, isLoading, isError } = useMediaUrl(sticky.content);
  const name = sticky.fileName ?? 'file';
  const kind = mediaKind(sticky.mimeType, name);

  if (isLoading) return <span className="sticky__text media-sticky__status">Loading…</span>;
  if (isError || !url) {
    return <span className="sticky__text media-sticky__status">Couldn’t load {name}</span>;
  }

  if (kind === 'IMAGE') {
    return <img className="media-sticky__image" src={url} alt={name} data-testid="media-image" />;
  }
  if (kind === 'VIDEO') {
    return (
      <video className="media-sticky__video" src={url} controls data-testid="media-video">
        <track kind="captions" />
      </video>
    );
  }
  if (kind === 'PDF') {
    return (
      <div className="media-sticky__doc" data-testid="media-pdf">
        <iframe className="media-sticky__pdf" src={url} title={name} />
        <a className="media-sticky__download" href={url} target="_blank" rel="noopener noreferrer">
          <IonIcon icon={documentOutline} /> {name}
        </a>
      </div>
    );
  }
  return (
    <a
      className="media-sticky__file"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      data-testid="media-file"
    >
      <IonIcon icon={downloadOutline} aria-hidden="true" />
      <span className="media-sticky__filename">{name}</span>
    </a>
  );
}
