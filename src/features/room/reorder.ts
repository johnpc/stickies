import type { StickyRecord } from '../../lib/dataClient';

/** A sticky's effective order key: its manual `ord` if set, else a big fallback
 * so un-ordered (older) stickies keep their created-order tail position. */
export function orderKey(s: StickyRecord, index: number): number {
  return typeof s.ord === 'number' ? s.ord : index;
}

/**
 * Compute the fractional `ord` to assign a sticky dropped BEFORE `targetIndex`
 * in the current visual order. Fractional ordering means a single move writes
 * one row (no full reindex): place it midway between the target's neighbors.
 * `ords` is the current list's order values in visual order. Pure + tested.
 */
export function ordForDropBefore(ords: number[], targetIndex: number): number {
  const STEP = 1;
  if (targetIndex <= 0) return (ords[0] ?? 0) - STEP; // dropped at the front
  if (targetIndex >= ords.length) return (ords[ords.length - 1] ?? 0) + STEP; // at the end
  return (ords[targetIndex - 1] + ords[targetIndex]) / 2; // between two neighbors
}

/** Reindex helper: assign clean integer ords 0..n-1 (used to seed ordering the
 * first time a room is dragged, so fractional gaps stay sane). Pure. */
export function sequentialOrds(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}
