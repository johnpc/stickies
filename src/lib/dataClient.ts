/**
 * Shared Amplify Data client (typed against the backend Schema).
 *
 * Stickies is guest-first, so the default authMode is 'identityPool' (the guest
 * role) and that's what every read/write uses — a room needs no account. A
 * client/schema provider mismatch returns empty results (not an error), so keep
 * new models granting `allow.guest()` for guest access to keep working.
 */
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

export const dataClient = generateClient<Schema>({ authMode: 'identityPool' });

/**
 * Unwrap an Amplify list/get result, THROWING when the call returned GraphQL
 * errors. Amplify resolves (never rejects) on a failed request — it hands back
 * `{ data: [], errors: [...] }` — so a transient failure otherwise looks
 * identical to "genuinely empty", silently degrading a read to an empty list.
 * Throwing lets react-query treat it as an error (retry + surfaced state)
 * instead of a false empty. Pure over its input.
 */
export function unwrap<T>(result: { data: T; errors?: readonly { message: string }[] }): T {
  if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join('; '));
  return result.data;
}

/**
 * Like unwrap, but for WRITES (create/update) — also throws when `data` is null.
 * Offline (or on a transient failure) Amplify's mutate resolves `{ data: null }`
 * WITHOUT an `errors` array, so plain unwrap would return null and the mutation
 * would "succeed" silently — the user's sticky vanishes with no feedback. A
 * write that produced no row is a failure; throwing lets react-query's onError
 * surface the "something went wrong" toast. Pure over its input.
 */
export function unwrapWrite<T>(result: {
  data: T | null;
  errors?: readonly { message: string }[];
}): T {
  const data = unwrap(result);
  if (data == null) throw new Error('Write failed (no data returned — likely offline).');
  return data;
}

export type StickyRecord = Schema['Sticky']['type'];
export type RoomRecord = Schema['Room']['type'];
export type PresenceRecord = Schema['Presence']['type'];
