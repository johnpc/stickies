import { useState, useCallback } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { keyboardMove, moveAnnouncement } from './keyboardReorder';

/**
 * Keyboard reorder for the grip: arrow keys move a focused sticky one slot and
 * persist via the same fractional-ord path as the pointer drag. Owns an
 * aria-live `announce` string so a screen-reader user hears the new position.
 * Kept out of StickyGrid so that component stays a lean renderer.
 */
export function useKeyboardReorder(
  stickies: StickyRecord[],
  onReorder: (id: string, ord: number) => void,
) {
  const [announce, setAnnounce] = useState('');

  const onGripKeyDown = useCallback(
    (id: string, e: React.KeyboardEvent) => {
      const dir =
        e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : e.key === 'ArrowRight' || e.key === 'ArrowDown'
            ? 1
            : 0;
      if (dir === 0) return;
      e.preventDefault(); // don't scroll the pad
      const move = keyboardMove(stickies, id, dir);
      if (move.change) onReorder(move.change.id, move.change.ord);
      setAnnounce(moveAnnouncement(move));
    },
    [stickies, onReorder],
  );

  return { announce, onGripKeyDown };
}
