import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyEditor } from './StickyEditor';

describe('StickyEditor', () => {
  it('saves the trimmed value on Enter', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="" onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: '  buy milk  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('buy milk');
  });

  it('does not save on Shift+Enter (newline)', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="x" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Enter', shiftKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<StickyEditor color="yellow" initial="x" onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('cancels rather than saving a blank value on blur (composer: no onEmpty)', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<StickyEditor color="yellow" initial="   " onSave={onSave} onCancel={onCancel} />);
    fireEvent.blur(screen.getByTestId('sticky-input'));
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('removes an existing note (onEmpty) when cleared to blank, instead of reverting', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onEmpty = vi.fn();
    render(
      <StickyEditor
        color="yellow"
        initial="old note"
        onSave={onSave}
        onCancel={onCancel}
        onEmpty={onEmpty}
      />,
    );
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEmpty).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
