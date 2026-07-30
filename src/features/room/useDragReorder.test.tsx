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
// getBoundingClientRect). Three 100px-wide cards on one row.
function stubGrid(): HTMLDivElement {
  const grid = document.createElement('div');
  list.forEach((_, i) => {
    const el = document.createElement('div');
    el.setAttribute('data-card-index', String(i));
    el.getBoundingClientRect = () =>
      ({ left: i * 100, right: i * 100 + 100, top: 0, bottom: 100 }) as DOMRect;
    grid.appendChild(el);
  });
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
