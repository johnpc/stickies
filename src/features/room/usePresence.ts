import { useEffect, useRef, useState } from 'react';
import { dataClient, type PresenceRecord } from '../../lib/dataClient';
import { getSessionId } from './sessionId';
import { heartbeat, clearPresence, reapPresence } from './presenceApi';
import { countLivePresence, reapableIds } from './presence';

const HEARTBEAT_MS = 10_000;
const RECOUNT_MS = 5_000;

/**
 * Tracks "how many people are here" for a room. This tab heartbeats its own
 * presence row every 10s (< the 30s freshness window); an observeQuery streams
 * the room's rows into a ref, and a 5s timer recomputes the fresh count (so it
 * self-corrects as rows go stale even without a new event). On unmount / tab
 * close we remove our row. All best-effort — presence must never break the pad.
 */
export function usePresence(room: string): number {
  // Start at 1: YOU are here, so the badge shows immediately without waiting for
  // the heartbeat → observeQuery round-trip (which lags on a loaded backend).
  const [count, setCount] = useState(room ? 1 : 0);
  const rowsRef = useRef<PresenceRecord[]>([]);

  useEffect(() => {
    if (!room) return;
    const sessionId = getSessionId();
    // Never drop below 1 while mounted — the live rows may briefly exclude our
    // own just-created row before the subscription catches up.
    const recount = () => setCount(Math.max(1, countLivePresence(rowsRef.current, Date.now())));
    const beat = () => heartbeat(sessionId, room, new Date().toISOString()).catch(() => {});
    beat();

    const sub = dataClient.models.Presence.observeQuery({
      filter: { room: { eq: room } },
    }).subscribe({
      next: ({ items }) => {
        rowsRef.current = items;
        recount();
        // Opportunistically delete long-dead rows (crashed tabs that never
        // cleaned up) so presence rows can't grow unbounded. Best-effort.
        for (const id of reapableIds(items, Date.now())) reapPresence(id).catch(() => {});
      },
    });
    const beatTimer = setInterval(beat, HEARTBEAT_MS);
    const recountTimer = setInterval(recount, RECOUNT_MS);
    const leave = () => clearPresence(sessionId).catch(() => {});
    window.addEventListener('pagehide', leave);

    return () => {
      clearInterval(beatTimer);
      clearInterval(recountTimer);
      sub.unsubscribe();
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, [room]);

  return count;
}
