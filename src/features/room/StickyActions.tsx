import { IonIcon } from '@ionic/react';
import { closeOutline, createOutline, reorderTwoOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import type { StickyColor } from './stickyPalette';
import type { StickySize } from './stickySize';
import { ColorPicker } from './ColorPicker';
import { ResizeButton } from './ResizeButton';
import { isEditableKind } from './isEditableKind';

interface StickyActionsProps {
  kind: StickyRecord['kind'];
  color: StickyColor;
  size: StickySize;
  onRecolor: (color: StickyColor) => void;
  onResize: (size: StickySize) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Begin a pointer-drag from the grip handle (mouse + touch). */
  onDragHandle?: (e: React.PointerEvent) => void;
}

/** The chrome row on a resting sticky: drag grip, color swatches, a resize
 * cycle, edit (text kinds only), and delete. Pure presentation — every action
 * is a callback the parent card owns. */
export function StickyActions(props: StickyActionsProps) {
  const { kind, color, size, onRecolor, onResize, onEdit, onDelete, onDragHandle } = props;
  return (
    <div className="sticky__actions">
      {onDragHandle && (
        <button
          className="sticky__grip"
          aria-label="Drag to reorder"
          data-testid="sticky-grip"
          onPointerDown={onDragHandle}
        >
          <IonIcon icon={reorderTwoOutline} />
        </button>
      )}
      <ColorPicker current={color} onPick={onRecolor} />
      <ResizeButton current={size} onResize={onResize} />
      {isEditableKind(kind) && (
        <button aria-label="Edit sticky" data-testid="sticky-edit" onClick={onEdit}>
          <IonIcon icon={createOutline} />
        </button>
      )}
      <button aria-label="Delete sticky" data-testid="sticky-delete" onClick={onDelete}>
        <IonIcon icon={closeOutline} />
      </button>
    </div>
  );
}
