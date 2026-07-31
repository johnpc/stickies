import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDragReorder } from './useDragReorder';
import type { StickyRecord } from '../../lib/dataClient';

// jsdom has no PointerEvent; the hook only reads clientX/clientY, so a plain
// Event with those fields attached is a faithful stand-in.
function pointer(type: string, clientX = 0, clientY = 0): Event {
  const e = new Event(type);
  Object.assign(e, { clientX, clientY });
  return e;
}

const list = [
  { id: 'a', ord: 0 },
  { id: 'b', ord: 1 },
  { id: 'c', ord: 2 },
] as StickyRecord[];

// A grid element whose cards report fixed rects (jsdom has no layout, so we stub
// getBoundingClientRect). `n` 100px-wide cards on one row.
function stubGrid(n = list.length): HTMLDivElement {
  const grid = document.createElement('div');
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.setAttribute('data-card-index', String(i));
    el.getBoundingClientRect = () =>
      ({ left: i * 100, right: i * 100 + 100, top: 0, bottom: 100 }) as DOMRect;
    grid.appendChild(el);
  }
  document.body.appendChild(grid);
  return grid;
}

describe('useDragReorder', () => {
  it('starts a drag, tracks the insert gap, and persists the new ord on release', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(list, onReorder));
    act(() => {
      result.current.gridRef.current = stubGrid();
    });

    act(() => result.current.startDrag('a'));
    expect(result.current.draggingId).toBe('a');

    // Move the pointer over the right half of card 2 → gap index 3 (the end).
    act(() => window.dispatchEvent(pointer('pointermove', 280, 50)));
    expect(result.current.insertIndex).toBe(3);

    act(() => window.dispatchEvent(pointer('pointerup')));
    // a moved to the end: between b(1) and c(2) → after c → 3.
    expect(onReorder).toHaveBeenCalledWith('a', 3);
    expect(result.current.draggingId).toBeNull();
  });

  it('computes the reorder from the CURRENT list, not the drag-start snapshot', () => {
    // Regression: the pointerup handler is registered once at drag start. If the
    // pad changes mid-drag (another viewer edits an ord), the release must use
    // the latest list — otherwise the sticky lands at an ord based on stale
    // neighbors and drops in the wrong place.
    const onReorder = vi.fn();
    const start = [
      { id: 'a', ord: 0 },
      { id: 'b', ord: 1 },
      { id: 'c', ord: 2 },
    ] as StickyRecord[];
    const { result, rerender } = renderHook(({ l }) => useDragReorder(l, onReorder), {
      initialProps: { l: start },
    });
    act(() => {
      result.current.gridRef.current = stubGrid(3);
    });
    act(() => result.current.startDrag('a'));

    // Mid-drag, another viewer bumps c's ord far out.
    const updated = [
      { id: 'a', ord: 0 },
      { id: 'b', ord: 1 },
      { id: 'c', ord: 100 },
    ] as StickyRecord[];
    act(() => rerender({ l: updated }));

    // Drop 'a' at the end (right half of card 2 → gap 3).
    act(() => window.dispatchEvent(pointer('pointermove', 280, 50)));
    act(() => window.dispatchEvent(pointer('pointerup')));
    // Must be 101 (after the CURRENT c=100), not 3 (after the stale c=2).
    expect(onReorder).toHaveBeenCalledWith('a', 101);
  });

  it('exposes an insertLine overlay box while dragging and clears it on release', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(list, onReorder));
    act(() => {
      const grid = stubGrid();
      grid.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
      result.current.gridRef.current = grid;
    });
    act(() => result.current.startDrag('a'));
    act(() => window.dispatchEvent(pointer('pointermove', 280, 50)));
    // A box exists to render the overlay bar (not a grid child), with a height.
    expect(result.current.insertLine).not.toBeNull();
    expect(result.current.insertLine?.height).toBeGreaterThan(0);
    act(() => window.dispatchEvent(pointer('pointerup')));
    expect(result.current.insertLine).toBeNull();
  });

  it('does not persist when released in the sticky’s own slot', () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(list, onReorder));
    act(() => {
      result.current.gridRef.current = stubGrid();
    });
    act(() => result.current.startDrag('b'));
    // Right half of card 0 → gap 1, which is b's own slot → no-op.
    act(() => window.dispatchEvent(pointer('pointermove', 80, 50)));
    act(() => window.dispatchEvent(pointer('pointerup')));
    expect(onReorder).not.toHaveBeenCalled();
  });
});
