import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyCard } from './StickyCard';
import type { StickyRecord } from '../../lib/dataClient';

const make = (over: Partial<StickyRecord>): StickyRecord =>
  ({ id: '1', room: 'r', kind: 'TEXT', content: 'note', color: 'yellow', ...over }) as StickyRecord;

describe('StickyCard', () => {
  it('renders text content plainly', () => {
    render(
      <StickyCard sticky={make({ content: 'buy milk' })} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('buy milk')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a LINK sticky as a safe anchor', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'LINK', content: 'example.com' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/');
  });

  it('does NOT render a javascript: link as a clickable href (XSS guard)', () => {
    render(
      <StickyCard
        sticky={make({ kind: 'LINK', content: 'javascript:alert(1)' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });

  it('swaps into an editor and saves an edit', () => {
    const onEdit = vi.fn();
    render(<StickyCard sticky={make({ content: 'old' })} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByTestId('sticky-edit'));
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'new' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('new');
  });

  it('fires onDelete', () => {
    const onDelete = vi.fn();
    render(<StickyCard sticky={make({})} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('sticky-delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
