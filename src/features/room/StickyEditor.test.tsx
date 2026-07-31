import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StickyEditor } from './StickyEditor';
import { onToast } from '../shell/toastBus';
import { MAX_CONTENT_BYTES } from './contentLimit';

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

  it('refuses to save an over-length note: toasts, keeps the draft, does not call onSave', () => {
    // Regression: an over-cap note failed the DynamoDB item-size limit with a
    // cryptic error whose Retry re-fired the same oversized write (infinite loop).
    const onSave = vi.fn();
    let toastMsg = '';
    const off = onToast((t) => (toastMsg = t.message));
    render(<StickyEditor color="yellow" initial="" onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByTestId('sticky-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'a'.repeat(MAX_CONTENT_BYTES + 1) } });
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    off();
    expect(onSave).not.toHaveBeenCalled(); // blocked before any write
    expect(toastMsg).toMatch(/too long/);
    // The editor stays open with the draft intact so the user can trim it.
    expect(screen.getByTestId('sticky-input')).toBeInTheDocument();
    expect(input.value).toHaveLength(MAX_CONTENT_BYTES + 1);
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

  it('rescues an unsaved dirty draft via onOrphan when yanked (remote delete)', () => {
    const onOrphan = vi.fn();
    const { unmount } = render(
      <StickyEditor
        color="yellow"
        initial="old"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={onOrphan}
      />,
    );
    fireEvent.change(screen.getByTestId('sticky-input'), {
      target: { value: 'my edit in progress' },
    });
    // Unmount WITHOUT save/cancel — the note was deleted out from under us.
    unmount();
    expect(onOrphan).toHaveBeenCalledWith('my edit in progress');
  });

  it('does NOT orphan on a plain re-render while dirty (peer activity on a shared pad)', () => {
    // Regression: the rescue effect was keyed on [initial, onOrphan]. onOrphan is
    // a fresh inline arrow each render and StickyCard isn't memoized, so any
    // re-render (e.g. a peer's observeQuery update) ran the cleanup while dirty —
    // firing a FALSE "note was deleted" toast and clobbering the clipboard.
    const onOrphan = vi.fn();
    const { rerender } = render(
      <StickyEditor
        color="yellow"
        initial="old"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={onOrphan}
      />,
    );
    fireEvent.change(screen.getByTestId('sticky-input'), { target: { value: 'unsaved draft' } });
    // Re-render with a NEW onOrphan reference (what happens on every parent render).
    rerender(
      <StickyEditor
        color="pink"
        initial="old"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={vi.fn()}
      />,
    );
    rerender(
      <StickyEditor
        color="blue"
        initial="old"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={vi.fn()}
      />,
    );
    // The editor is still mounted — no rescue should have fired.
    expect(onOrphan).not.toHaveBeenCalled();
    expect(screen.getByTestId('sticky-input')).toBeInTheDocument();
  });

  it('does NOT orphan when the editor is unmounted after a normal save', () => {
    const onOrphan = vi.fn();
    const { unmount } = render(
      <StickyEditor
        color="yellow"
        initial="old"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={onOrphan}
      />,
    );
    fireEvent.change(screen.getByTestId('sticky-input'), { target: { value: 'saved text' } });
    fireEvent.pointerDown(screen.getByTestId('sticky-save'));
    unmount();
    expect(onOrphan).not.toHaveBeenCalled();
  });

  it('does NOT orphan an unchanged (non-dirty) editor on unmount', () => {
    const onOrphan = vi.fn();
    const { unmount } = render(
      <StickyEditor
        color="yellow"
        initial="unchanged"
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOrphan={onOrphan}
      />,
    );
    unmount();
    expect(onOrphan).not.toHaveBeenCalled();
  });

  it('keeps the note size so editing a Large note does not collapse it', () => {
    // Regression: the editor rendered size-less, so a Large/Small note snapped to
    // Medium (and reflowed the pad) the moment you tapped Edit.
    const { container } = render(
      <StickyEditor color="yellow" initial="big" size="L" onSave={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.querySelector('.sticky')).toHaveClass('sticky--size-L');
  });

  it('defaults to Medium size when none is given (composer)', () => {
    const { container } = render(
      <StickyEditor color="yellow" initial="" onSave={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.querySelector('.sticky')).toHaveClass('sticky--size-M');
  });
});
