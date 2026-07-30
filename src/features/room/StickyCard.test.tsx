import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

// LINK bodies fetch an OG preview via a hook that hits the Amplify client; stub
// it (no preview → plain link path) so StickyCard tests stay isolated.
vi.mock('./useLinkPreview', () => ({
  useLinkPreview: () => ({ preview: undefined, isLoading: false }),
}));
// Media bodies pull the storage client; stub the renderer so a media StickyCard
// test can focus on the card chrome (e.g. whether Edit is offered).
vi.mock('./MediaSticky', () => ({ MediaSticky: () => <div data-testid="media-body" /> }));

import { StickyCard } from './StickyCard';

const make = (over: Partial<StickyRecord>): StickyRecord =>
  ({ id: '1', room: 'r', kind: 'TEXT', content: 'note', color: 'yellow', ...over }) as StickyRecord;

describe('StickyCard', () => {
  it('renders text content plainly', () => {
    render(
      <StickyCard
        sticky={make({ content: 'buy milk' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('buy milk')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a LINK sticky as a safe anchor', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'LINK', content: 'example.com' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/');
  });

  it('does NOT render a javascript: link as a clickable href (XSS guard)', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'LINK', content: 'javascript:alert(1)' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });

  it('swaps into an editor and saves an edit', () => {
    const onEdit = vi.fn();
    render(
      <StickyCard
        sticky={make({ content: 'old' })}
        index={0}
        onEdit={onEdit}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('sticky-edit'));
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'new' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('new');
  });

  it('fires onDelete', () => {
    const onDelete = vi.fn();
    render(
      <StickyCard
        sticky={make({})}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTestId('sticky-delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('recolors via the swatch row', () => {
    const onRecolor = vi.fn();
    render(
      <StickyCard
        sticky={make({ color: 'yellow' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={onRecolor}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('color-blue'));
    expect(onRecolor).toHaveBeenCalledWith('blue');
  });

  it('offers Edit for a text sticky', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'TEXT' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId('sticky-edit')).toBeInTheDocument();
  });

  it('hides Edit for a media sticky (its content is an S3 key, not text)', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'IMAGE', content: 'rooms/r/1-a.png', fileName: 'a.png' })}
        index={0}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('sticky-edit')).not.toBeInTheDocument();
    // color + delete are still available on a media sticky.
    expect(screen.getByTestId('sticky-delete')).toBeInTheDocument();
  });
});
