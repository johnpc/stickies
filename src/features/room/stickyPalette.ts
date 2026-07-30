/**
 * Sticky-note colors. A small fixed palette; a new sticky's color is chosen by
 * rotating through it (deterministic given an index — no Math.random in logic,
 * per the determinism gate). Each name maps to a --sk-note-* token in CSS.
 */
export const STICKY_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;

export type StickyColor = (typeof STICKY_COLORS)[number];

const DEFAULT_COLOR: StickyColor = 'yellow';

/** The palette color at a rotating position (e.g. the current sticky count). */
export function colorForIndex(index: number): StickyColor {
  const n = STICKY_COLORS.length;
  return STICKY_COLORS[((index % n) + n) % n];
}

/** Coerce a stored color string back to a known StickyColor (default yellow). */
export function asStickyColor(value: string | null | undefined): StickyColor {
  return STICKY_COLORS.includes(value as StickyColor) ? (value as StickyColor) : DEFAULT_COLOR;
}
