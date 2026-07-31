import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { usePresence } = vi.hoisted(() => ({ usePresence: vi.fn() }));
vi.mock('./usePresence', () => ({ usePresence }));

import { PresenceBadge } from './PresenceBadge';

describe('PresenceBadge', () => {
  it('shows the live count when at least one viewer is present', () => {
    usePresence.mockReturnValue(3);
    render(<PresenceBadge room="r" />);
    expect(screen.getByTestId('presence-badge')).toHaveTextContent('3 here');
  });

  it('renders nothing while connecting (count 0)', () => {
    usePresence.mockReturnValue(0);
    render(<PresenceBadge room="r" />);
    expect(screen.queryByTestId('presence-badge')).not.toBeInTheDocument();
  });

  it('is a polite live region with a clear, pluralized accessible label', () => {
    usePresence.mockReturnValue(2);
    render(<PresenceBadge room="r" />);
    const badge = screen.getByTestId('presence-badge');
    // Announced when someone joins/leaves (the point of the count).
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-live', 'polite');
    // Meaningful label, not a bare "2 here".
    expect(badge).toHaveAttribute('aria-label', '2 people viewing this room');
  });

  it('uses the singular "person" for a lone viewer', () => {
    usePresence.mockReturnValue(1);
    render(<PresenceBadge room="r" />);
    expect(screen.getByTestId('presence-badge')).toHaveAttribute(
      'aria-label',
      '1 person viewing this room',
    );
  });
});
