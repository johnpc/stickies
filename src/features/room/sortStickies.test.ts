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

  it('sorts ord-carrying notes ahead of un-ordered ones', () => {
    const out = sortStickies([sticky('plain', '2026-01-01Z'), sticky('moved', '2026-01-02Z', 5)]);
    expect(out.map((s) => s.id)).toEqual(['moved', 'plain']);
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
});
