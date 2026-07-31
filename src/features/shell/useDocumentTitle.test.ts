import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

afterEach(() => {
  document.title = 'original';
});

describe('useDocumentTitle', () => {
  it('sets the document title while mounted', () => {
    document.title = 'original';
    renderHook(() => useDocumentTitle('Grocery List · Stickies'));
    expect(document.title).toBe('Grocery List · Stickies');
  });

  it('restores the previous title on unmount', () => {
    document.title = 'original';
    const { unmount } = renderHook(() => useDocumentTitle('Room · Stickies'));
    expect(document.title).toBe('Room · Stickies');
    unmount();
    expect(document.title).toBe('original');
  });

  it('updates when the title changes', () => {
    document.title = 'original';
    const { rerender } = renderHook(({ t }) => useDocumentTitle(t), {
      initialProps: { t: 'A · Stickies' },
    });
    expect(document.title).toBe('A · Stickies');
    rerender({ t: 'B · Stickies' });
    expect(document.title).toBe('B · Stickies');
  });
});
