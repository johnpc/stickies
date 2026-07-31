import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useScrollLock } from './useScrollLock';
import { restoreFocus } from './restoreFocus';
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        // Focus trap: Tab/Shift+Tab must cycle WITHIN the dialog, not escape to
        // the pad behind it (aria-modal alone doesn't stop the browser). Wrap
        // from last→first (and first→last on Shift+Tab).
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog so Escape/Tab act on it (not a background card)
    // and screen-reader focus lands on the overlay, not the pad behind it.
    const restoreTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      // Return focus to the opener. restoreFocus handles the case where it's an
      // Ionic host (e.g. the share <ion-button>) whose own .focus() is a no-op —
      // previously that dropped focus to <body> on close.
      restoreFocus(restoreTo);
    };
  }, [onClose]);

  return createPortal(
    <div className="lightbox" data-testid="lightbox" onClick={onClose}>
      <div
        ref={panelRef}
        className="lightbox__panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox__bar">
          <span className="lightbox__title">{title}</span>
          <button
            ref={closeRef}
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
