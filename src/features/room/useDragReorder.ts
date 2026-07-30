import { useState } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { orderKey, ordForDropBefore } from './reorder';

/**
 * HTML5 drag-to-reorder state for the pad. Tracks the dragged sticky + the
 * current hover target, and on drop computes a fractional `ord` (via
 * ordForDropBefore) placing the dragged note before the target, then calls
 * onReorder to persist it. Kept as a hook so StickyGrid stays presentational.
 */
export function useDragReorder(
  stickies: StickyRecord[],
  onReorder: (id: string, ord: number) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const drop = (targetIndex: number) => {
    const dragging = stickies.find((s) => s.id === draggingId);
    setTargetId(null);
    setDraggingId(null);
    if (!dragging) return;
    const others = stickies.filter((s) => s.id !== dragging.id);
    const insertAt =
      targetIndex > stickies.findIndex((s) => s.id === dragging.id) ? targetIndex - 1 : targetIndex;
    const ords = others.map((s, i) => orderKey(s, i));
    const ord = ordForDropBefore(ords, insertAt);
    if (ord !== dragging.ord) onReorder(dragging.id, ord);
  };

  return {
    dragProps: (sticky: StickyRecord, index: number) => ({
      onDragStart: () => setDraggingId(sticky.id),
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (sticky.id !== targetId) setTargetId(sticky.id);
      },
      onDrop: () => drop(index),
      isTarget: targetId === sticky.id && draggingId !== sticky.id,
    }),
  };
}
