import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, createOutline, reorderTwoOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { asStickyColor, type StickyColor } from './stickyPalette';
import { StickyBody } from './StickyBody';
import { StickyEditor } from './StickyEditor';
import { ColorPicker } from './ColorPicker';
import { isEditableKind } from './isEditableKind';
import { editableContent } from './editableContent';
import { copyText } from './copyText';
import { showToast } from '../shell/toastBus';
import './sticky.css';

interface StickyCardProps {
  sticky: StickyRecord;
  index: number;
  onEdit: (content: string) => void;
  onRecolor: (color: StickyColor) => void;
  onDelete: () => void;
  /** True while this card is the one being dragged (dims it). */
  dragging?: boolean;
  /** Begin a pointer-drag from the grip handle (mouse + touch). */
  onDragHandle?: (e: React.PointerEvent) => void;
}

/** One note on the pad. The body is rendered by StickyBody; this shell owns the
 * card chrome, color swatches, a drag GRIP (pointer-based reorder), and the
 * inline-edit swap. `data-card-index` lets the drag hook hit-test card rects. */
export function StickyCard(props: StickyCardProps) {
  const { sticky, index, onEdit, onRecolor, onDelete, dragging, onDragHandle } = props;
  const [editing, setEditing] = useState(false);
  const color = asStickyColor(sticky.color);

  if (editing) {
    return (
      <StickyEditor
        color={color}
        initial={editableContent(sticky)}
        onCancel={() => setEditing(false)}
        onSave={(content) => {
          onEdit(content);
          setEditing(false);
        }}
        onEmpty={() => {
          // Clearing an existing note to blank removes it (undoable via the
          // delete toast) — same as Notes/Keep, not a silent revert.
          setEditing(false);
          onDelete();
        }}
        onOrphan={(draft) => {
          // The note was deleted by someone else while we were editing it. Don't
          // lose the typed text: stash it on the clipboard and say so.
          void copyText(draft);
          showToast('That note was deleted — your unsaved text was copied to the clipboard.');
        }}
      />
    );
  }

  return (
    <div
      className={`sticky sticky--${color}${dragging ? ' sticky--dragging' : ''}`}
      data-testid="sticky"
      data-card-index={index}
    >
      <div className="sticky__body">
        <StickyBody sticky={sticky} />
      </div>
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
        {isEditableKind(sticky.kind) && (
          <button
            aria-label="Edit sticky"
            data-testid="sticky-edit"
            onClick={() => setEditing(true)}
          >
            <IonIcon icon={createOutline} />
          </button>
        )}
        <button aria-label="Delete sticky" data-testid="sticky-delete" onClick={onDelete}>
          <IonIcon icon={closeOutline} />
        </button>
      </div>
    </div>
  );
}
