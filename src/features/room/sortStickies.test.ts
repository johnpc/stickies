import { describe, expect, it } from 'vitest';
import { sortStickies } from './sortStickies';
import type { StickyRecord } from '../../lib/dataClient';

const sticky = (id: string, createdAt?: string) => ({ id, createdAt }) as StickyRecord;

describe('sortStickies', () => {
  it('orders by createdAt ascending', () => {
    const out = sortStickies([
      sticky('b', '2026-01-02T00:00:00Z'),
      sticky('a', '2026-01-01T00:00:00Z'),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b']);
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
