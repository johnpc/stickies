import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, createOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { asStickyColor, type StickyColor } from './stickyPalette';
import { StickyBody } from './StickyBody';
import { StickyEditor } from './StickyEditor';
import { ColorPicker } from './ColorPicker';
import './sticky.css';

interface StickyCardProps {
  sticky: StickyRecord;
  onEdit: (content: string) => void;
  onRecolor: (color: StickyColor) => void;
  onDelete: () => void;
  /** Drag-to-reorder handlers wired by the grid (HTML5 DnD). */
  drag?: {
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    isTarget: boolean;
  };
}

/** One note on the pad. The body is rendered by StickyBody; this shell owns the
 * card chrome, color swatches, drag-to-reorder, and the inline-edit swap. */
export function StickyCard({ sticky, onEdit, onRecolor, onDelete, drag }: StickyCardProps) {
  const [editing, setEditing] = useState(false);
  const color = asStickyColor(sticky.color);

  if (editing) {
    return (
      <StickyEditor
        color={color}
        initial={sticky.content}
        onCancel={() => setEditing(false)}
        onSave={(content) => {
          onEdit(content);
          setEditing(false);
        }}
      />
    );
  }

  const className = `sticky sticky--${color}${drag?.isTarget ? ' sticky--drop-target' : ''}`;
  return (
    <div
      className={className}
      data-testid="sticky"
      draggable={!!drag}
      onDragStart={drag?.onDragStart}
      onDragOver={drag?.onDragOver}
      onDrop={drag?.onDrop}
    >
      <div className="sticky__body">
        <StickyBody sticky={sticky} />
      </div>
      <div className="sticky__actions">
        <ColorPicker current={color} onPick={onRecolor} />
        <button aria-label="Edit sticky" data-testid="sticky-edit" onClick={() => setEditing(true)}>
          <IonIcon icon={createOutline} />
        </button>
        <button aria-label="Delete sticky" data-testid="sticky-delete" onClick={onDelete}>
          <IonIcon icon={closeOutline} />
        </button>
      </div>
    </div>
  );
}
