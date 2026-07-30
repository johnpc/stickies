import { useCallback, useRef, useState } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { computeReorder, insertIndexFromPoint, type CardRect } from './reorder';

/**
 * Pointer-based drag-to-reorder (works with mouse AND touch, unlike native HTML5
 * DnD). A card's drag HANDLE calls startDrag; we then track the pointer, compute
 * which GAP it's over (insertIndex) from the live card rects, and on release
 * persist a fractional `ord` via onReorder. Returns `insertIndex` so the grid can
 * draw an insertion line BETWEEN cards (not a drop-on-card outline).
 */
export function useDragReorder(
  stickies: StickyRecord[],
  onReorder: (id: string, ord: number) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Read the current card rectangles from the DOM (data-card-index on each card).
  const readCards = useCallback((): CardRect[] => {
    const grid = gridRef.current;
    if (!grid) return [];
    return Array.from(grid.querySelectorAll<HTMLElement>('[data-card-index]')).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        index: Number(el.dataset.cardIndex),
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      };
    });
  }, []);

  const startDrag = useCallback(
    (id: string) => {
      setDraggingId(id);
      const move = (e: PointerEvent) =>
        setInsertIndex(insertIndexFromPoint(readCards(), e.clientX, e.clientY));
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        setInsertIndex((idx) => {
          if (idx != null) {
            const change = computeReorder(stickies, id, idx);
            if (change) onReorder(change.id, change.ord);
          }
          return null;
        });
        setDraggingId(null);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [readCards, stickies, onReorder],
  );

  return { gridRef, draggingId, insertIndex, startDrag };
}
