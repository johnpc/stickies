import type { StickyRecord } from '../../lib/dataClient';
import { computeReorder } from './reorder';

/**
 * Keyboard reorder: drag-to-reorder is pointer-only, leaving keyboard and
 * switch-access users unable to reorder at all (the grip's Enter/Space did
 * nothing). This maps a directional key press on a focused sticky to the same
 * fractional-ord move the pointer drag persists, reusing computeReorder so both
 * paths agree. Pure + unit-testable.
 *
 * `dir` is -1 (move one slot toward the start) or +1 (toward the end). The insert
 * index for "swap with the previous item" is fromIndex-1; for "after the next
 * item" it's fromIndex+2 (computeReorder treats insertIndex as a GAP position).
 */
export interface KeyboardMove {
  /** The {id, ord} to persist (null at an edge / when it wouldn't move). */
  change: { id: string; ord: number } | null;
  /** The new 0-based position after the move (unchanged at an edge). */
  index: number;
  /** Total number of stickies (for an "x of n" announcement). */
  total: number;
}

export function keyboardMove(stickies: StickyRecord[], id: string, dir: -1 | 1): KeyboardMove {
  const total = stickies.length;
  const from = stickies.findIndex((s) => s.id === id);
  if (from < 0) return { change: null, index: -1, total };
  // At an edge in the requested direction → no move.
  if ((dir < 0 && from === 0) || (dir > 0 && from === total - 1)) {
    return { change: null, index: from, total };
  }
  const insertIndex = dir < 0 ? from - 1 : from + 2;
  const change = computeReorder(stickies, id, insertIndex);
  return { change, index: from + dir, total };
}

/** A screen-reader announcement for a keyboard move (1-based position). */
export function moveAnnouncement(move: KeyboardMove): string {
  if (!move.change) return 'Already at the edge';
  return `Moved to position ${move.index + 1} of ${move.total}`;
}
