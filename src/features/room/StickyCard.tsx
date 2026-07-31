import { useState } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { asStickyColor, type StickyColor } from './stickyPalette';
import { asStickySize, type StickySize } from './stickySize';
import { StickyBody } from './StickyBody';
import { StickyEditor } from './StickyEditor';
import { StickyActions } from './StickyActions';
import { editableContent } from './editableContent';
import { copyText } from './copyText';
import { showToast } from '../shell/toastBus';
import './sticky.css';

interface StickyCardProps {
  sticky: StickyRecord;
  index: number;
  onEdit: (content: string) => void;
  onRecolor: (color: StickyColor) => void;
  onResize: (size: StickySize) => void;
  onDelete: () => void;
  /** True while this card is the one being dragged (dims it). */
  dragging?: boolean;
  /** Begin a pointer-drag from the grip handle (mouse + touch). */
  onDragHandle?: (e: React.PointerEvent) => void;
}

/** One note on the pad. The body is rendered by StickyBody; this shell owns the
 * card chrome (StickyActions), the S/M/L size class, and the inline-edit swap.
 * `data-card-index` lets the drag hook hit-test card rects. */
export function StickyCard(props: StickyCardProps) {
  const { sticky, index, onEdit, onRecolor, onResize, onDelete, dragging, onDragHandle } = props;
  const [editing, setEditing] = useState(false);
  const color = asStickyColor(sticky.color);
  const size = asStickySize(sticky.size);

  if (editing) {
    return (
      <StickyEditor
        color={color}
        size={size}
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
      className={`sticky sticky--${color} sticky--size-${size}${dragging ? ' sticky--dragging' : ''}`}
      data-testid="sticky"
      data-card-index={index}
      data-size={size}
    >
      <div className="sticky__body">
        <StickyBody sticky={sticky} />
      </div>
      <StickyActions
        kind={sticky.kind}
        color={color}
        size={size}
        onRecolor={onRecolor}
        onResize={onResize}
        onEdit={() => setEditing(true)}
        onDelete={onDelete}
        onDragHandle={onDragHandle}
      />
    </div>
  );
}
