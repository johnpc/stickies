/** Server calls for room presence. A viewer upserts its own row (id = session id)
 * on a heartbeat and deletes it on leave. The room header subscribes separately
 * (observeQuery) and counts fresh rows via countLivePresence. */
import { dataClient, unwrap } from '../../lib/dataClient';

/** Upsert this session's presence row for a room (create first time, then update
 * the heartbeat). The row id is the per-tab session id, which SURVIVES in-tab
 * room navigation — so the update MUST also rewrite `room`, otherwise a viewer
 * who moves from room A to room B stays advertised in A (a phantom that keeps
 * being heartbeated) and is missing from B's `room`-filtered stream. Best-effort:
 * presence must never break the pad, so failures are swallowed by the caller. */
export async function heartbeat(sessionId: string, room: string, now: string): Promise<void> {
  const existing = unwrap(await dataClient.models.Presence.get({ id: sessionId }));
  if (existing) {
    unwrap(await dataClient.models.Presence.update({ id: sessionId, room, heartbeatAt: now }));
  } else {
    unwrap(await dataClient.models.Presence.create({ id: sessionId, room, heartbeatAt: now }));
  }
}

/** Remove this session's presence row (on leaving the room / unmount). */
export async function clearPresence(sessionId: string): Promise<void> {
  unwrap(await dataClient.models.Presence.delete({ id: sessionId }));
}

/** Reap a long-dead row (a crashed tab's session that never cleaned up). Same
 * delete as clearPresence but named for intent — any live viewer may reap. */
export async function reapPresence(id: string): Promise<void> {
  unwrap(await dataClient.models.Presence.delete({ id }));
}
