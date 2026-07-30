import type { CSSProperties } from 'react';
import './skeleton.css';

interface SkeletonProps {
  /** CSS width (default 100%). */
  width?: string;
  /** CSS height (default a text line). */
  height?: string;
  /** Border radius (default the small token; pass '50%' for a circle). */
  radius?: string;
  className?: string;
}

/** A single shimmering placeholder block — the atom every skeleton is built from.
 * Purely decorative (aria-hidden); screens wrap groups of these in an
 * aria-busy/label region. Consumes --sk-skeleton-* tokens only. */
export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  const style: CSSProperties = {
    width: width ?? '100%',
    height: height ?? '1em',
    borderRadius: radius ?? 'var(--sk-radius-sm)',
  };
  return (
    <span
      className={className ? `sk-skeleton ${className}` : 'sk-skeleton'}
      style={style}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
}
