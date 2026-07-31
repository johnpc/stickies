import { useState } from 'react';
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
 * as the composer's textarea). Enter saves, Escape cancels. A blank value
 * cancels in the composer (can't create an empty note); when editing an
 * existing note, a blank value removes it via onEmpty (an undoable delete). */
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
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
