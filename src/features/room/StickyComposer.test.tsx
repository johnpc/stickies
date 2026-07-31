import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyComposer } from './StickyComposer';

describe('StickyComposer', () => {
  it('expands into an editor on click and adds a sticky', () => {
    const onAdd = vi.fn();
    render(<StickyComposer count={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByTestId('sticky-add'));
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'first note' } });
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    expect(onAdd).toHaveBeenCalledWith('first note');
  });

  it('collapses back to the add button after cancel', () => {
    render(<StickyComposer count={0} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByTestId('sticky-add'));
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Escape' });
    expect(screen.getByTestId('sticky-add')).toBeInTheDocument();
  });
});
