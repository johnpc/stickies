import { describe, expect, it } from 'vitest';
import { keyboardMove, moveAnnouncement } from './keyboardReorder';
import type { StickyRecord } from '../../lib/dataClient';

const list = [
  { id: 'a', ord: 0 },
  { id: 'b', ord: 1 },
  { id: 'c', ord: 2 },
] as StickyRecord[];

describe('keyboardMove', () => {
  it('moves a middle sticky toward the start (swap with previous)', () => {
    const move = keyboardMove(list, 'b', -1);
    expect(move.index).toBe(0);
    expect(move.total).toBe(3);
    // Lands before a(0) → ord < 0.
    expect(move.change?.id).toBe('b');
    expect(move.change?.ord).toBeLessThan(0);
  });

  it('moves a middle sticky toward the end (after the next)', () => {
    const move = keyboardMove(list, 'b', 1);
    expect(move.index).toBe(2);
    // Lands after c(2) → ord > 2.
    expect(move.change?.ord).toBeGreaterThan(2);
  });

  it('is a no-op at the start edge (moving further toward start)', () => {
    const move = keyboardMove(list, 'a', -1);
    expect(move.change).toBeNull();
    expect(move.index).toBe(0);
  });

  it('is a no-op at the end edge (moving further toward end)', () => {
    const move = keyboardMove(list, 'c', 1);
    expect(move.change).toBeNull();
    expect(move.index).toBe(2);
  });

  it('returns no change for an unknown id', () => {
    expect(keyboardMove(list, 'zzz', 1).change).toBeNull();
  });
});

describe('moveAnnouncement', () => {
  it('announces the new 1-based position for a real move', () => {
    expect(moveAnnouncement(keyboardMove(list, 'a', 1))).toBe('Moved to position 2 of 3');
  });

  it('announces an edge when there was no move', () => {
    expect(moveAnnouncement(keyboardMove(list, 'a', -1))).toBe('Already at the edge');
  });
});
