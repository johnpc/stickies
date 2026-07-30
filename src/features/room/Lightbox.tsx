import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import './lightbox.css';

interface LightboxProps {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

/** A full-page overlay for viewing a sticky's content large (image/video/code/
 * doc). Closes on the ✕, a backdrop click, or Escape. Portaled to <body> so its
 * `position: fixed` escapes the sticky card's transform (which would otherwise
 * trap it). Presentation only — the caller owns the open/closed state. */
export function Lightbox({ title, onClose, children }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="lightbox" data-testid="lightbox" onClick={onClose}>
      <div
        className="lightbox__panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox__bar">
          <span className="lightbox__title">{title}</span>
          <button
            className="lightbox__close"
            aria-label="Close"
            data-testid="lightbox-close"
            onClick={onClose}
          >
            <IonIcon icon={closeOutline} />
          </button>
        </div>
        <div className="lightbox__content">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
