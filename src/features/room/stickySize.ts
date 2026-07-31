/**
 * Sticky sizes. A note can be made small, medium (default), or large to give it
 * visual weight on a shared pad ("pin this one"). Stored as a short token on the
 * Sticky model, mirroring the color field. The resize control cycles S → M → L →
 * S, so `nextSize` defines that rotation. Pure — no DOM, unit-testable.
 */
export const STICKY_SIZES = ['S', 'M', 'L'] as const;

export type StickySize = (typeof STICKY_SIZES)[number];

const DEFAULT_SIZE: StickySize = 'M';

/** Human labels for the resize control's aria-label (announced to assistive tech). */
export const SIZE_LABELS: Record<StickySize, string> = {
  S: 'small',
  M: 'medium',
  L: 'large',
};

/** Coerce a stored size string back to a known StickySize (default medium). */
export function asStickySize(value: string | null | undefined): StickySize {
  return STICKY_SIZES.includes(value as StickySize) ? (value as StickySize) : DEFAULT_SIZE;
}

/** The next size in the S → M → L → S cycle (what the resize button applies). */
export function nextSize(size: StickySize): StickySize {
  const i = STICKY_SIZES.indexOf(size);
  return STICKY_SIZES[(i + 1) % STICKY_SIZES.length];
}
