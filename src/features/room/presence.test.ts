import { describe, expect, it } from 'vitest';
import { countLivePresence, reapableIds, PRESENCE_TTL_MS, PRESENCE_REAP_MS } from './presence';
import type { PresenceRecord } from '../../lib/dataClient';

const at = (ms: number) => new Date(ms).toISOString();
const row = (heartbeatAt?: string) => ({ id: 'x', room: 'r', heartbeatAt }) as PresenceRecord;

describe('countLivePresence', () => {
  const now = 1_000_000;

  it('counts rows heartbeated within the TTL', () => {
    const rows = [row(at(now - 1_000)), row(at(now - 5_000))];
    expect(countLivePresence(rows, now)).toBe(2);
  });

  it('ignores rows older than the TTL (a closed tab that never cleaned up)', () => {
    const rows = [row(at(now - 1_000)), row(at(now - PRESENCE_TTL_MS - 1))];
    expect(countLivePresence(rows, now)).toBe(1);
  });

  it('ignores rows with a missing/unparseable heartbeat', () => {
    expect(countLivePresence([row(undefined), row('not-a-date')], now)).toBe(0);
  });

  it('is 0 for no rows', () => {
    expect(countLivePresence([], now)).toBe(0);
  });
});

describe('reapableIds', () => {
  const now = 2_000_000;

  it('returns ids of rows older than the reap threshold', () => {
    const rows = [
      { id: 'fresh', room: 'r', heartbeatAt: at(now - 1_000) },
      { id: 'dead', room: 'r', heartbeatAt: at(now - PRESENCE_REAP_MS - 1) },
    ] as PresenceRecord[];
    expect(reapableIds(rows, now)).toEqual(['dead']);
  });

  it('does NOT reap merely-stale rows still within the reap window', () => {
    // Older than the count TTL but younger than the reap threshold → keep.
    const rows = [
      { id: 'stale', room: 'r', heartbeatAt: at(now - PRESENCE_TTL_MS - 1) },
    ] as PresenceRecord[];
    expect(reapableIds(rows, now)).toEqual([]);
  });

  it('reaps rows with a missing/unparseable heartbeat', () => {
    expect(reapableIds([row(undefined), row('nope')], now)).toEqual(['x', 'x']);
  });
});
