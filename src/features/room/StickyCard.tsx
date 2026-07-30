import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, createOutline } from 'ionicons/icons';
import type { StickyRecord } from '../../lib/dataClient';
import { asStickyColor } from './stickyPalette';
import { safeHref } from './safeHref';
import { StickyEditor } from './StickyEditor';
import './sticky.css';

interface StickyCardProps {
  sticky: StickyRecord;
  onEdit: (content: string) => void;
  onDelete: () => void;
}

/** One note on the pad. Renders LINK stickies as a guarded <a> (safeHref blocks
 * javascript:/data: URLs — the pad is world-writable), everything else as text.
 * Tapping edit swaps in an inline editor; the color comes from a palette token. */
export function StickyCard({ sticky, onEdit, onDelete }: StickyCardProps) {
  const [editing, setEditing] = useState(false);
  const color = asStickyColor(sticky.color);
  const href = sticky.kind === 'LINK' ? safeHref(sticky.content) : null;

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
        {href ? (
          <a className="sticky__link" href={href} target="_blank" rel="noopener noreferrer">
            {sticky.content}
          </a>
        ) : (
          <span className="sticky__text">{sticky.content}</span>
        )}
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
