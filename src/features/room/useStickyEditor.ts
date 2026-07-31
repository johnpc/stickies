import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { autoGrow } from './autoGrow';

interface UseStickyEditorArgs {
  initial: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  onEmpty?: () => void;
  onOrphan?: (draft: string) => void;
}

/**
 * All the behavior behind StickyEditor, so the component stays pure JSX:
 * - `value` + `setValue` for the textarea,
 * - a textarea ref + auto-grow (roomy editing of a long note, capped),
 * - `commit` (save / delete-when-blank / cancel), and
 * - orphan rescue: if the editor unmounts with an unsaved dirty draft and no
 *   explicit save/cancel (the note was deleted out from under the user), hand
 *   the draft back via onOrphan instead of losing it.
 */
export function useStickyEditor({
  initial,
  onSave,
  onCancel,
  onEmpty,
  onOrphan,
}: UseStickyEditorArgs) {
  const [value, setValue] = useState(initial);
  const draftRef = useRef(initial);
  draftRef.current = value;
  const settledRef = useRef(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    autoGrow(taRef.current);
  }, [value]);

  useEffect(() => {
    return () => {
      const draft = draftRef.current.trim();
      if (!settledRef.current && draft && draft !== initial.trim()) onOrphan?.(draft);
    };
  }, [initial, onOrphan]);

  const commit = () => {
    settledRef.current = true;
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    else if (onEmpty) onEmpty();
    else onCancel();
  };

  const cancel = () => {
    settledRef.current = true;
    onCancel();
  };

  return { value, setValue, taRef, commit, cancel };
}
