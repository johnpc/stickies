import { useState } from 'react';
import type { StickyColor } from './stickyPalette';
import './sticky.css';

interface StickyEditorProps {
  color: StickyColor;
  initial: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

/** Inline editor shown in place of a sticky while editing (also reused, empty,
 * as the composer's textarea). Enter saves, Escape cancels; a blank value is
 * ignored so an empty note can't be created. */
export function StickyEditor({ color, initial, onSave, onCancel }: StickyEditorProps) {
  const [value, setValue] = useState(initial);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
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
