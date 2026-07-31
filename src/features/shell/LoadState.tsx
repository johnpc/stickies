import { type ReactNode } from 'react';
import { alertCircleOutline, fileTrayOutline } from 'ionicons/icons';
import { EmptyState } from './EmptyState';
import { SkeletonRows } from './SkeletonRows';
import { RetryButton } from './RetryButton';

interface LoadStateProps {
  isLoading: boolean;
  isError?: boolean;
  /** True when loading finished but there's nothing to show. */
  isEmpty?: boolean;
  /** Copy for the default empty state (error copy is standard). */
  emptyTitle?: string;
  emptyMessage?: string;
  /** A bespoke empty state (e.g. one with a CTA) — overrides emptyTitle/Message. */
  emptyState?: ReactNode;
  /** Retry the failed fetch (react-query refetch). */
  onRetry?: () => void;
  /** Content-shaped loading placeholder. Defaults to card-row skeletons. */
  skeleton?: ReactNode;
  children: ReactNode;
}

/** Uniform loading / error / empty gate for a data screen. Renders content-shaped
 * skeletons while loading, a retryable error state on failure, an empty state when
 * there's nothing, and otherwise the children. Stops screens from hanging on a
 * spinner or silently blanking when a fetch fails. */
export function LoadState({
  isLoading,
  isError,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyState,
  onRetry,
  skeleton,
  children,
}: LoadStateProps) {
  if (isLoading) {
    return <div data-testid="load-loading">{skeleton ?? <SkeletonRows />}</div>;
  }
  if (isError) {
    return (
      <EmptyState
        icon={alertCircleOutline}
        title="Something went wrong"
        message="We couldn’t load this. Check your connection and try again."
        testId="load-error"
      >
        {onRetry && <RetryButton onRetry={onRetry} />}
      </EmptyState>
    );
  }
  if (isEmpty) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <EmptyState
        icon={fileTrayOutline}
        title={emptyTitle}
        message={emptyMessage}
        testId="load-empty"
      />
    );
  }
  return <>{children}</>;
}
