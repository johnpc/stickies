import { describe, expect, it } from 'vitest';
import { sortStickies } from './sortStickies';
import type { StickyRecord } from '../../lib/dataClient';

const sticky = (id: string, createdAt?: string, ord?: number) =>
  ({ id, createdAt, ord }) as StickyRecord;

describe('sortStickies', () => {
  it('orders by createdAt ascending when no ord is set', () => {
    const out = sortStickies([
      sticky('b', '2026-01-02T00:00:00Z'),
      sticky('a', '2026-01-01T00:00:00Z'),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('orders by manual ord when set (drag-reorder wins)', () => {
    const out = sortStickies([
      sticky('a', '2026-01-01Z', 2),
      sticky('b', '2026-01-02Z', 0.5),
      sticky('c', '2026-01-03Z', 1),
    ]);
    expect(out.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('places a null-ord note by its createdAt on the same scale as real ords', () => {
    // A null ord falls back to createdAt-as-epoch-millis, so a note reordered to
    // sit AFTER a null-ord neighbour needs an ord past that neighbour's createdAt
    // — mirrors what computeReorder writes. (Old behaviour parked null ords at
    // Infinity, which snapped a freshly-reordered seed sticky to the front.)
    const plainMs = Date.parse('2026-01-01T00:00:00.000Z');
    const out = sortStickies([
      sticky('plain', '2026-01-01T00:00:00.000Z'), // effectiveOrd ≈ plainMs
      sticky('moved', '2026-01-02T00:00:00.000Z', plainMs + 1), // reordered just after plain
    ]);
    expect(out.map((s) => s.id)).toEqual(['plain', 'moved']);
  });

  it('does not mutate the input array', () => {
    const input = [sticky('b', '2026-01-02Z'), sticky('a', '2026-01-01Z')];
    sortStickies(input);
    expect(input[0].id).toBe('b');
  });

  it('treats missing createdAt as earliest', () => {
    const out = sortStickies([sticky('b', '2026-01-01Z'), sticky('a')]);
    expect(out[0].id).toBe('a');
  });

  it('is a TOTAL order — two adds in the same millisecond sort identically on every device', () => {
    // App-written ord IS the createdAt-ms, so two rapid adds collide on BOTH ord
    // and createdAt. Without an id tiebreak, JS's stable sort keeps each device's
    // own input order, so a fetch and a live snapshot (delivered in different
    // sequence) show the pair flipped for different viewers. The id tiebreak pins
    // one order regardless of input sequence.
    const ms = Date.parse('2026-01-01T00:00:00.000Z');
    const x = sticky('x', '2026-01-01T00:00:00.000Z', ms);
    const y = sticky('y', '2026-01-01T00:00:00.000Z', ms);
    const deviceA = sortStickies([x, y]).map((s) => s.id);
    const deviceB = sortStickies([y, x]).map((s) => s.id);
    expect(deviceA).toEqual(deviceB);
    expect(deviceA).toEqual(['x', 'y']); // ascending by id, deterministic everywhere
  });
});
