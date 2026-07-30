import type { StickyRecord } from '../../lib/dataClient';

/** Stickies in the pad's natural order: oldest-created first, so a note keeps
 * its place as others are added/edited. Pure — a stable sort over a copy. */
export function sortStickies(items: readonly StickyRecord[]): StickyRecord[] {
  return [...items].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}
