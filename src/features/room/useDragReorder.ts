import { useCallback, useRef, useState } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import { computeReorder, insertIndexFromPoint, type CardRect } from './reorder';
import { insertLineRect, type LineBox, type RelRect } from './insertLineRect';

/**
 * Pointer-based drag-to-reorder (works with mouse AND touch, unlike native HTML5
 * DnD). A card's drag HANDLE calls startDrag; we then track the pointer, compute
 * which GAP it's over (insertIndex) from the live card rects, and on release
 * persist a fractional `ord` via onReorder. Returns `insertLine` — the pixel box
 * for an OVERLAY insertion bar (positioned in the target gap, not a grid child,
 * so it doesn't reflow the pad mid-drag).
 */
export function useDragReorder(
  stickies: StickyRecord[],
  onReorder: (id: string, ord: number) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [insertLine, setInsertLine] = useState<LineBox | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Hold the LATEST list in a ref: the pointerup handler is registered once at
  // drag start, so closing over `stickies` would compute the reorder against a
  // stale snapshot if another viewer adds/removes a sticky mid-drag — while the
  // insert index comes from the live DOM. Reading the ref keeps both current.
  const stickiesRef = useRef(stickies);
  stickiesRef.current = stickies;

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

  // Card boxes relative to the grid's padding box, for positioning the overlay
  // insertion bar (getBoundingClientRect is viewport-relative; subtract the
  // grid's own origin + scroll so the absolute overlay lands in the right gap).
  const relCards = useCallback((cards: CardRect[]): RelRect[] => {
    const grid = gridRef.current;
    if (!grid) return [];
    const g = grid.getBoundingClientRect();
    return cards.map((c) => ({
      index: c.index,
      left: c.left - g.left + grid.scrollLeft,
      right: c.right - g.left + grid.scrollLeft,
      top: c.top - g.top + grid.scrollTop,
      bottom: c.bottom - g.top + grid.scrollTop,
    }));
  }, []);

  const gridGap = () => {
    const grid = gridRef.current;
    return grid ? parseFloat(getComputedStyle(grid).columnGap) || 0 : 0;
  };

  const startDrag = useCallback(
    (id: string) => {
      setDraggingId(id);
      const move = (e: PointerEvent) => {
        const cards = readCards();
        const idx = insertIndexFromPoint(cards, e.clientX, e.clientY);
        setInsertIndex(idx);
        setInsertLine(insertLineRect(relCards(cards), idx, gridGap()));
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        setInsertIndex((idx) => {
          if (idx != null) {
            const change = computeReorder(stickiesRef.current, id, idx);
            if (change) onReorder(change.id, change.ord);
          }
          return null;
        });
        setInsertLine(null);
        setDraggingId(null);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [readCards, relCards, onReorder],
  );

  return { gridRef, draggingId, insertIndex, insertLine, startDrag };
}
