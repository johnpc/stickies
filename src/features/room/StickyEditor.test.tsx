import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyEditor } from './StickyEditor';

describe('StickyEditor', () => {
  it('does NOT save on a plain Enter (Enter inserts a newline for multi-line notes)', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="line one" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the trimmed value via the Save button', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId('sticky-input'), { target: { value: '  buy milk  ' } });
    // pointerDown (not click) so the commit beats the textarea's blur.
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    expect(onSave).toHaveBeenCalledWith('buy milk');
  });

  it('saves on Cmd/Ctrl+Enter (desktop quick-save)', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="a\nb" onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'a\nb' } });
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
    expect(onSave).toHaveBeenCalledWith('a\nb');
  });

  it('preserves a multi-line value when saving', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId('sticky-input'), {
      target: { value: 'milk\neggs\nbread' },
    });
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Enter', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith('milk\neggs\nbread');
  });

  it('cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<StickyEditor color="yellow" initial="x" onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId('sticky-input'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('commits on blur (tap away)', () => {
    const onSave = vi.fn();
    render(<StickyEditor color="yellow" initial="note" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.blur(screen.getByTestId('sticky-input'));
    expect(onSave).toHaveBeenCalledWith('note');
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
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    expect(onEmpty).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
