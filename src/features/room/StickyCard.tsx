import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, createOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { asStickyColor } from './stickyPalette';
import { StickyBody } from './StickyBody';
import { StickyEditor } from './StickyEditor';
import './sticky.css';

interface StickyCardProps {
  sticky: StickyRecord;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

/** One note on the pad. The body (text / guarded link / highlighted code) is
 * rendered by StickyBody; this shell owns the card chrome, color, and the
 * inline-edit swap. */
export function StickyCard({ sticky, onEdit, onDelete }: StickyCardProps) {
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

  return (
    <div className={`sticky sticky--${color}`} data-testid="sticky">
      <div className="sticky__body">
        <StickyBody sticky={sticky} />
      </div>
      <div className="sticky__actions">
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
