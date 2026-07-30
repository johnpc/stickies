import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoadState } from './LoadState';

const child = <div data-testid="content">ready</div>;

describe('LoadState', () => {
  it('shows skeleton placeholders while loading (never the children)', () => {
    render(<LoadState isLoading>{child}</LoadState>);
    expect(screen.getByTestId('load-loading')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-rows')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('renders a bespoke skeleton override when provided', () => {
    render(
      <LoadState isLoading skeleton={<div data-testid="board-skeleton" />}>
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('board-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-rows')).not.toBeInTheDocument();
  });

  it('shows a retryable error state on failure', () => {
    const onRetry = vi.fn();
    render(
      <LoadState isLoading={false} isError onRetry={onRetry}>
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('load-error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('load-retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('error takes priority over empty', () => {
    render(
      <LoadState isLoading={false} isError isEmpty>
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('load-error')).toBeInTheDocument();
    expect(screen.queryByTestId('load-empty')).not.toBeInTheDocument();
  });

  it('shows the default empty state with custom copy when empty', () => {
    render(
      <LoadState isLoading={false} isEmpty emptyTitle="No rooms yet">
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('load-empty')).toHaveTextContent('No rooms yet');
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('renders the children when loaded, present, and error-free', () => {
    render(
      <LoadState isLoading={false} isError={false} isEmpty={false}>
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders a bespoke empty override over the default', () => {
    render(
      <LoadState isLoading={false} isEmpty emptyState={<div data-testid="custom-empty" />}>
        {child}
      </LoadState>,
    );
    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('load-empty')).not.toBeInTheDocument();
  });
});
