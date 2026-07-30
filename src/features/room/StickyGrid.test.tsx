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
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getAllByTestId('sticky-delete')[1]);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
    fireEvent.click(screen.getAllByTestId('sticky-edit')[0]);
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'edited' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('1', 'edited');
  });
});
