import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyActions } from './StickyActions';

const base = {
  kind: 'TEXT' as const,
  color: 'yellow' as const,
  size: 'M' as const,
  onRecolor: vi.fn(),
  onResize: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('StickyActions', () => {
  it('shows color, resize, edit and delete for a text sticky', () => {
    render(<StickyActions {...base} />);
    expect(screen.getByTestId('color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('sticky-resize')).toBeInTheDocument();
    expect(screen.getByTestId('sticky-edit')).toBeInTheDocument();
    expect(screen.getByTestId('sticky-delete')).toBeInTheDocument();
  });

  it('hides edit for a media sticky but keeps resize', () => {
    render(<StickyActions {...base} kind="IMAGE" />);
    expect(screen.queryByTestId('sticky-edit')).not.toBeInTheDocument();
    expect(screen.getByTestId('sticky-resize')).toBeInTheDocument();
  });

  it('renders the grip only when a drag handler is provided', () => {
    const { rerender } = render(<StickyActions {...base} />);
    expect(screen.queryByTestId('sticky-grip')).not.toBeInTheDocument();
    rerender(<StickyActions {...base} onDragHandle={vi.fn()} />);
    expect(screen.getByTestId('sticky-grip')).toBeInTheDocument();
  });

  it('routes each action to its callback', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<StickyActions {...base} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('sticky-edit'));
    fireEvent.click(screen.getByTestId('sticky-delete'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
