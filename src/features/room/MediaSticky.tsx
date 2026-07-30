import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { mediaKind } from './mediaKind';
import { useMediaUrl } from './useMediaUrl';
import { mediaPreview } from './mediaPreview';
import { MediaActions } from './MediaActions';
import { Lightbox } from './Lightbox';
import './mediaSticky.css';

/** Renders a media sticky from its S3 key: an inline preview for image/PDF/video
 * (each with download + an Expand button that pops out to a full-page lightbox),
 * or a generic download card for opaque files. Kind is re-derived from the stored
 * mimeType/fileName so a bad `kind` still renders sensibly. */
export function MediaSticky({ sticky }: { sticky: StickyRecord }) {
  const [expanded, setExpanded] = useState(false);
  const { url, isLoading, isError } = useMediaUrl(sticky.content);
  const name = sticky.fileName ?? 'file';
  const kind = mediaKind(sticky.mimeType, name);

  if (isLoading) return <span className="sticky__text media-sticky__status">Loading…</span>;
  if (isError || !url) {
    return <span className="sticky__text media-sticky__status">Couldn’t load {name}</span>;
  }

  // Opaque files: a plain download card, no preview/expand.
  if (kind === 'FILE') {
    return (
      <a
        className="media-sticky__file"
        href={url}
        download={name}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="media-file"
      >
        <IonIcon icon={downloadOutline} aria-hidden="true" />
        <span className="media-sticky__filename">{name}</span>
      </a>
    );
  }

  return (
    <div className="media-sticky" data-testid={`media-${kind.toLowerCase()}-wrap`}>
      {mediaPreview(kind, url, name)}
      <MediaActions url={url} fileName={name} onExpand={() => setExpanded(true)} />
      {expanded && (
        <Lightbox title={name} onClose={() => setExpanded(false)}>
          {mediaPreview(kind, url, name, true)}
        </Lightbox>
      )}
    </div>
  );
}
