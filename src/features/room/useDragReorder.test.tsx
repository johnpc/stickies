import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDragReorder } from './useDragReorder';
import type { StickyRecord } from '../../lib/dataClient';

const list = [
  { id: 'a', ord: 0 },
  { id: 'b', ord: 1 },
  { id: 'c', ord: 2 },
] as StickyRecord[];

// A drag "session": start on `dragId`, hover `overIndex`, drop there. Re-reads
// result.current after each state change (act flushes the re-render) so the drop
// closure sees the latest draggingId/targetId.
function runDrag(dragId: string, overIndex: number, onReorder: (id: string, ord: number) => void) {
  const { result } = renderHook(() => useDragReorder(list, onReorder));
  const dragIndex = list.findIndex((s) => s.id === dragId);
  act(() => result.current.dragProps(list[dragIndex], dragIndex).onDragStart());
  act(() =>
    result.current.dragProps(list[overIndex], overIndex).onDragOver({
      preventDefault: () => {},
    } as React.DragEvent),
  );
  act(() => result.current.dragProps(list[overIndex], overIndex).onDrop());
}

describe('useDragReorder', () => {
  it('moves a note forward: dropping "a" onto index 2 lands it between b and c', () => {
    const onReorder = vi.fn();
    runDrag('a', 2, onReorder);
    // others=[b(1),c(2)], insertAt=2-1=1 → between 1 and 2 → 1.5
    expect(onReorder).toHaveBeenCalledWith('a', 1.5);
  });

  it('moves a note backward: dropping "c" onto index 0 lands it before a', () => {
    const onReorder = vi.fn();
    runDrag('c', 0, onReorder);
    // others=[a(0),b(1)], insertAt=0 → before first → -1
    expect(onReorder).toHaveBeenCalledWith('c', -1);
  });

  it('does not persist when dropped in place (ord unchanged)', () => {
    const onReorder = vi.fn();
    runDrag('a', 0, onReorder);
    expect(onReorder).not.toHaveBeenCalled();
  });
});
