import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyGrid } from './StickyGrid';
import type { StickyRecord } from '../../lib/dataClient';

const stickies = [
  { id: '1', room: 'r', kind: 'TEXT', content: 'one', color: 'yellow' },
  { id: '2', room: 'r', kind: 'TEXT', content: 'two', color: 'pink' },
] as StickyRecord[];

describe('StickyGrid', () => {
  it('renders every sticky plus the composer', () => {
    render(
      <StickyGrid
        stickies={stickies}
        onAdd={vi.fn()}
        onUpload={vi.fn()}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onResize={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId('sticky')).toHaveLength(2);
    expect(screen.getByTestId('sticky-add')).toBeInTheDocument();
  });

  it('threads the sticky id through edit and delete', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <StickyGrid
        stickies={stickies}
        onAdd={vi.fn()}
        onUpload={vi.fn()}
        onEdit={onEdit}
        onRecolor={vi.fn()}
        onResize={vi.fn()}
        onReorder={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getAllByTestId('sticky-delete')[1]);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
    fireEvent.click(screen.getAllByTestId('sticky-edit')[0]);
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'edited' } });
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    expect(onEdit).toHaveBeenCalledWith('1', 'edited');
  });

  it('reorders with the keyboard from the grip and announces the move (a11y)', () => {
    const onReorder = vi.fn();
    render(
      <StickyGrid
        stickies={stickies}
        onAdd={vi.fn()}
        onUpload={vi.fn()}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onResize={vi.fn()}
        onReorder={onReorder}
        onDelete={vi.fn()}
      />,
    );
    // Focus the first sticky's grip and press ArrowRight → it moves after #2.
    fireEvent.keyDown(screen.getAllByTestId('sticky-grip')[0], { key: 'ArrowRight' });
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder.mock.calls[0][0]).toBe('1'); // moved sticky #1
    expect(screen.getByTestId('reorder-live')).toHaveTextContent('Moved to position 2 of 2');
  });

  it('does not reorder past the start edge and says so', () => {
    const onReorder = vi.fn();
    render(
      <StickyGrid
        stickies={stickies}
        onAdd={vi.fn()}
        onUpload={vi.fn()}
        onEdit={vi.fn()}
        onRecolor={vi.fn()}
        onResize={vi.fn()}
        onReorder={onReorder}
        onDelete={vi.fn()}
      />,
    );
    // First sticky, ArrowLeft → already at the start, no persist.
    fireEvent.keyDown(screen.getAllByTestId('sticky-grip')[0], { key: 'ArrowLeft' });
    expect(onReorder).not.toHaveBeenCalled();
    expect(screen.getByTestId('reorder-live')).toHaveTextContent('Already at the edge');
  });
});
