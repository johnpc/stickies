import type { PresenceRecord } from '../../lib/dataClient';

/** A presence row is "live" if its heartbeat is within this window. Tabs heartbeat
 * more often than this, so a closed tab drops out within ~one window even if its
 * row wasn't cleaned up. */
export const PRESENCE_TTL_MS = 30_000;

/** Rows older than this are safe to DELETE — the owning tab is long gone (a
 * crash/kill/tab-discard skips the clean pagehide cleanup). Set generously past
 * the TTL so a merely-slow heartbeat is never reaped out from under a live tab. */
export const PRESENCE_REAP_MS = 2 * PRESENCE_TTL_MS;

/** Whether a heartbeat timestamp is within the freshness window at `now`. */
function isFresh(heartbeatAt: string | null | undefined, now: number, windowMs: number): boolean {
  const t = heartbeatAt ? Date.parse(heartbeatAt) : NaN;
  return Number.isFinite(t) && now - t < windowMs;
}

/** Count DISTINCT live viewers from presence rows, given "now" (injected so it's
 * pure + testable). A row counts if its heartbeat is within PRESENCE_TTL_MS; the
 * row id is the session id, so rows are already one-per-tab. */
export function countLivePresence(rows: readonly PresenceRecord[], now: number): number {
  return rows.filter((r) => isFresh(r.heartbeatAt, now, PRESENCE_TTL_MS)).length;
}

/** Ids of rows old enough to delete (past PRESENCE_REAP_MS) — dead sessions that
 * never cleaned up. A live viewer opportunistically reaps these so rows can't
 * grow unbounded. Pure over its input. */
export function reapableIds(rows: readonly PresenceRecord[], now: number): string[] {
  return rows.filter((r) => !isFresh(r.heartbeatAt, now, PRESENCE_REAP_MS)).map((r) => r.id);
}
