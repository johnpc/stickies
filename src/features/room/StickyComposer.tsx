import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { StickyEditor } from './StickyEditor';
import { colorForIndex } from './stickyPalette';
import './sticky.css';

interface StickyComposerProps {
  /** How many stickies the pad already has — drives the new note's color. */
  count: number;
  onAdd: (content: string) => void;
}

/** The "add a sticky" affordance: a dashed placeholder card that expands into an
 * editor on tap, saves, and collapses — ready for the next note. */
export function StickyComposer({ count, onAdd }: StickyComposerProps) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <StickyEditor
        color={colorForIndex(count)}
        initial=""
        onCancel={() => setOpen(false)}
        onSave={(content) => {
          onAdd(content);
          setOpen(false);
        }}
      />
    );
  }

  return (
    <button className="sticky sticky--add" data-testid="sticky-add" onClick={() => setOpen(true)}>
      <IonIcon icon={addOutline} aria-hidden="true" />
      <span>Add a sticky</span>
    </button>
  );
}
