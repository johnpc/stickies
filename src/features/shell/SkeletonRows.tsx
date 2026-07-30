import { Skeleton } from './Skeleton';

interface SkeletonRowsProps {
  /** How many placeholder rows to show (default 5). */
  count?: number;
  /** Accessible label announced while the real content loads. */
  label?: string;
}

/** A list of card-shaped skeleton rows — the default placeholder for a data
 * screen's list while it loads. Each row previews a title line + a shorter meta
 * line. Purely a loading affordance. */
export function SkeletonRows({ count = 5, label = 'Loading' }: SkeletonRowsProps) {
  return (
    <ul
      className="sk-skeleton-rows"
      aria-busy="true"
      aria-label={label}
      data-testid="skeleton-rows"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="sk-skeleton-row">
          <Skeleton width="62%" height="1.1rem" />
          <Skeleton width="34%" height="0.8rem" />
        </li>
      ))}
    </ul>
  );
}
