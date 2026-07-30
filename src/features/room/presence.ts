import type { PresenceRecord } from '../../lib/dataClient';

/** A presence row is "live" if its heartbeat is within this window. Tabs heartbeat
 * more often than this, so a closed tab drops out within ~one window even if its
 * row wasn't cleaned up. */
export const PRESENCE_TTL_MS = 30_000;

/** Count DISTINCT live viewers from presence rows, given "now" (injected so it's
 * pure + testable). A row counts if its heartbeat is within PRESENCE_TTL_MS; the
 * row id is the session id, so rows are already one-per-tab. Never returns < 1
 * for a viewer who is themselves present — but that's the caller's own row, so
 * we just count what's fresh. */
export function countLivePresence(rows: readonly PresenceRecord[], now: number): number {
  return rows.filter((r) => {
    const t = r.heartbeatAt ? Date.parse(r.heartbeatAt) : NaN;
    return Number.isFinite(t) && now - t < PRESENCE_TTL_MS;
  }).length;
}
