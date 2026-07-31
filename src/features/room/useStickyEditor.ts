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
  // Read `onOrphan`/`initial` through refs so the rescue effect below can have an
  // EMPTY dep array. Keying it on those (onOrphan is a fresh inline arrow each
  // render, initial changes when the note updates) made React run the cleanup on
  // every re-render while dirty — firing a false "that note was deleted" toast
  // and clobbering the clipboard whenever anyone else touched the shared pad.
  const onOrphanRef = useRef(onOrphan);
  onOrphanRef.current = onOrphan;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useLayoutEffect(() => {
    autoGrow(taRef.current);
  }, [value]);

  // Rescue an unsaved draft ONLY on a true unmount (the note was deleted out from
  // under the editor). Empty deps → the cleanup runs once, at unmount, not on
  // every re-render.
  useEffect(() => {
    return () => {
      const draft = draftRef.current.trim();
      if (!settledRef.current && draft && draft !== initialRef.current.trim()) {
        onOrphanRef.current?.(draft);
      }
    };
  }, []);

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
