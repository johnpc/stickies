import { IonIcon } from '@ionic/react';
import { resizeOutline } from 'ionicons/icons';
import { nextSize, SIZE_LABELS, type StickySize } from './stickySize';

interface ResizeButtonProps {
  current: StickySize;
  onResize: (size: StickySize) => void;
}

/** Cycles a sticky's size S → M → L → S to make one note bigger/more prominent
 * on the pad. Pure presentation — the parent owns the resize mutation. The label
 * announces the CURRENT size and what tapping will do, for assistive tech. */
export function ResizeButton({ current, onResize }: ResizeButtonProps) {
  const next = nextSize(current);
  return (
    <button
      type="button"
      aria-label={`Resize sticky (${SIZE_LABELS[current]}; tap for ${SIZE_LABELS[next]})`}
      data-testid="sticky-resize"
      data-size={current}
      onClick={() => onResize(next)}
    >
      <IonIcon icon={resizeOutline} />
    </button>
  );
}
