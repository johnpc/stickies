import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import type { StickyColor } from './stickyPalette';
import './sticky.css';

interface StickyEditorProps {
  color: StickyColor;
  initial: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  /** Edit mode only: called when an EXISTING note is cleared to blank, so the
   * emptied note is removed (like Notes/Keep) rather than silently reverting.
   * Omitted by the composer, where a blank value just cancels (no empty note). */
  onEmpty?: () => void;
}

/** Inline editor shown in place of a sticky while editing (also reused, empty,
 * as the composer's textarea). Enter inserts a NEWLINE so multi-line notes work
 * on mobile (soft keyboards have no Shift+Enter); commit via the Save button,
 * Cmd/Ctrl+Enter, or blur (tap away). Escape cancels. A blank value cancels in
 * the composer (can't create an empty note); when editing an existing note, a
 * blank value removes it via onEmpty (an undoable delete). */
export function StickyEditor({ color, initial, onSave, onCancel, onEmpty }: StickyEditorProps) {
  const [value, setValue] = useState(initial);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    else if (onEmpty) onEmpty();
    else onCancel();
  };

  return (
    <div className={`sticky sticky--${color}`}>
      <textarea
        className="sticky__input"
        data-testid="sticky-input"
        autoFocus
        value={value}
        placeholder="Note, link, or ```code```…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter = newline (default). Cmd/Ctrl+Enter is a quick-save shortcut.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        onBlur={commit}
      />
      <div className="sticky__editor-actions">
        <button
          type="button"
          className="sticky__save"
          data-testid="sticky-save"
          aria-label="Save note"
          // Commit on pointerdown (not click) so we save BEFORE the textarea's
          // blur fires — and preventDefault so the button doesn't steal focus
          // and double-fire commit via blur.
          onPointerDown={(e) => {
            e.preventDefault();
            commit();
          }}
        >
          <IonIcon icon={checkmarkOutline} /> Save
        </button>
      </div>
    </div>
  );
}
