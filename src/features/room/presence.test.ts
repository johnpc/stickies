import { describe, expect, it } from 'vitest';
import { countLivePresence, PRESENCE_TTL_MS } from './presence';
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
